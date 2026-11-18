import { get_cart_adjustment_reason } from "@/lib/cart/cart"
import type { CartValidationResult } from "@/lib/cart/types"
import { get_product_variants } from "@/lib/catalog/catalog"
import type { ProductHit } from "@/lib/catalog/types"
import type { SalesChannel } from "@/lib/channel/types"
import { get_available_quantity_by_size } from "@/lib/catalog/stock"
import { get_product_quantity_limits } from "@/lib/shared/utils"
import type { Store, StoreCartAvailability, StoreCartChange, StoreCartLineAvailability, StoreCartLineStatus, StoreCartProduct, StoreCartReconciliation, StoreGroup } from "@/lib/stores/types"

// Los nombres coinciden con stock_by_location del catálogo en ambos canales.
const stores: Store[] = [
  { id: "san-jose-tienda-escazu", province: "San José", locale_name: "Tienda Escazú" },
  { id: "san-jose-tienda-san-jose", province: "San José", locale_name: "Tienda San José" },
  { id: "limon-tienda-limon", province: "Limón", locale_name: "Tienda Limón" },
  { id: "limon-tienda-guapiles", province: "Limón", locale_name: "Tienda Guápiles" },
]

/**
 * Busca un local concreto en el registro de tiendas habilitadas.
 * @param store_id Identificador del local, o null si no hay selección.
 * @returns Tienda registrada, o null si no existe.
 */
export function get_store(store_id: string | null): Store | null {
  return stores.find((store) => store.id === store_id) ?? null
}

/**
 * Agrupa las tiendas por provincia y ordena las provincias y los locales según las reglas del español.
 * @returns Provincias con sus tiendas ordenadas.
 */
export function get_store_groups(): StoreGroup[] {
  const provinces = [...new Set(stores.map((store) => store.province))].sort((first, second) => first.localeCompare(second, "es"))
  return provinces.map((province) => ({
    province,
    stores: stores.filter((store) => store.province === province).sort((first, second) => first.locale_name.localeCompare(second.locale_name, "es")),
  }))
}

/**
 * Calcula la disponibilidad de una línea del carrito en una sede.
 * @param product Línea del carrito.
 * @param variant Variante del índice del canal, o undefined si no existe.
 * @param store Sede que se evalúa.
 * @returns Estado de la línea y stock de la talla en la sede.
 */
export function get_store_line_availability(product: StoreCartProduct, variant: ProductHit | undefined, store: Store): StoreCartLineAvailability {
  const base = { item_id: product.id, quantity: product.quantity }
  if (!variant) return { ...base, status: "unavailable", available_quantity: 0 }
  const available_quantity = Array.isArray(variant.stock_by_location) ? get_available_quantity_by_size(variant.stock_by_location, product.selected_size, store) : null
  const limits = get_product_quantity_limits(variant, available_quantity)
  if (available_quantity === null || !limits) return { ...base, status: "unknown", available_quantity: null }
  const { min_quantity, max_quantity, step_quantity } = limits
  const quantity_cap = Math.min(product.quantity, max_quantity)
  const quantity = quantity_cap < min_quantity ? 0 : min_quantity + Math.floor((quantity_cap - min_quantity) / step_quantity) * step_quantity
  const status: StoreCartLineStatus = quantity === 0 ? "unavailable" : quantity === product.quantity ? "available" : "reduced"
  return { ...base, status, available_quantity }
}

/**
 * Calcula la disponibilidad del carrito en cada sede.
 * @param products Líneas del carrito.
 * @param channel Canal de venta cuyo inventario se consulta.
 * @returns Promesa con la disponibilidad por sede.
 */
export async function get_cart_store_availability(products: StoreCartProduct[], channel: SalesChannel): Promise<StoreCartAvailability[]> {
  if (products.length === 0) return []
  const product_ids = [...new Set(products.map((product) => product.product_id))]
  const responses = await Promise.allSettled(product_ids.map((product_id) => get_product_variants(product_id, channel)))
  const variants_by_product = new Map(product_ids.map((product_id, index) => {
    const response = responses[index]
    return [product_id, response.status === "fulfilled" ? response.value : null] as const
  }))
  return stores.map((store) => {
    const lines = products.map((product): StoreCartLineAvailability => {
      const variants = variants_by_product.get(product.product_id)
      if (!variants) return { item_id: product.id, quantity: product.quantity, status: "unknown", available_quantity: null }
      const variant = variants.find((candidate) => candidate.product_id === product.product_id && candidate.sku === product.sku)
      return get_store_line_availability(product, variant, store)
    })
    const count = (status: StoreCartLineStatus) => lines.filter((line) => line.status === status).length
    return {
      store,
      lines,
      available_count: count("available"),
      reduced_count: count("reduced"),
      unavailable_count: count("unavailable"),
      unknown_count: count("unknown"),
      available_units: lines.reduce((total, line) => total + (line.available_quantity ?? 0), 0),
    }
  })
}

/**
 * Elige la sede que cubre más líneas completas del carrito.
 * @param availabilities Disponibilidad del carrito por sede.
 * @returns Sede sugerida, o null si ninguna se pudo comprobar.
 */
export function select_best_cart_store(availabilities: StoreCartAvailability[]): Store | null {
  let best: StoreCartAvailability | null = null
  for (const availability of availabilities) {
    if (availability.unknown_count > 0 || availability.lines.length === 0) continue
    const is_better = !best ||
      availability.available_count > best.available_count ||
      (availability.available_count === best.available_count && availability.unavailable_count < best.unavailable_count) ||
      (availability.available_count === best.available_count && availability.unavailable_count === best.unavailable_count && availability.available_units > best.available_units)
    if (is_better) best = availability
  }
  return best?.store ?? null
}

/**
 * Consulta la disponibilidad del carrito y elige la sede sugerida.
 * @param products Líneas del carrito.
 * @param channel Canal de venta cuyo inventario se consulta.
 * @returns Promesa con la sede sugerida, o null si el carrito está vacío.
 * @throws Si no se pudo comprobar el inventario.
 */
export async function get_best_cart_store(products: StoreCartProduct[], channel: SalesChannel): Promise<Store | null> {
  if (products.length === 0) return null
  const store = select_best_cart_store(await get_cart_store_availability(products, channel))
  if (!store) throw new Error("No se pudo comprobar el inventario para elegir la tienda.")
  return store
}

/**
 * Resume en texto la disponibilidad del carrito en una sede.
 * @param availability Disponibilidad del carrito en la sede.
 * @returns Texto del resumen.
 */
export function get_store_availability_text(availability: StoreCartAvailability): string {
  const { unknown_count, unavailable_count, reduced_count } = availability
  if (unknown_count > 0) return "No pudimos comprobar la disponibilidad"
  const parts: string[] = []
  if (unavailable_count > 0) parts.push(`Sin stock de ${unavailable_count} ${unavailable_count === 1 ? "producto" : "productos"}`)
  if (reduced_count > 0) parts.push(`${reduced_count} ${reduced_count === 1 ? "producto" : "productos"} con menos unidades`)
  return parts.length > 0 ? parts.join(" · ") : "Todo disponible"
}

/**
 * Describe las unidades disponibles de una talla en una sede.
 * @param available_quantity Unidades disponibles.
 * @param store Sede elegida, o null si no hay.
 * @returns Texto de disponibilidad.
 */
export function get_available_quantity_text(available_quantity: number, store: Store | null): string {
  const place = store ? store.locale_name : "la tienda con más unidades"
  if (available_quantity <= 0) return `Sin unidades en ${place}`
  return `Disponible: ${available_quantity} ${available_quantity === 1 ? "unidad" : "unidades"} en ${place}`
}

/**
 * Recupera el identificador de la tienda guardada y lo comprueba contra el registro de locales.
 * @returns Tienda registrada, o null si no existe una selección válida o falla la lectura.
 */
export function get_stored_store(): Store | null {
  try {
    return get_store(window.localStorage.getItem("space-shop-store"))
  } catch {
    return null
  }
}

/**
 * Guarda la selección de tienda o elimina su clave cuando no hay selección.
 * Un error de almacenamiento no impide continuar con la selección en memoria.
 * @param store Tienda elegida, o null para eliminar la selección guardada.
 * @returns No retorna ningún valor.
 */
export function save_store(store: Store | null): void {
  try {
    if (store) window.localStorage.setItem("space-shop-store", store.id)
    else window.localStorage.removeItem("space-shop-store")
  } catch {
    return
  }
}

/**
 * Reduce cantidades al mayor valor permitido y retira líneas sin stock; nunca elimina por un fallo de consulta.
 * No aumenta cantidades y conserva las líneas cuyos límites no se pudieron comprobar.
 * @param results Validaciones del carrito correspondientes a una misma tienda.
 * @returns Validaciones ajustadas, identificadores de líneas a eliminar y cambios que se deben informar.
 */
export function reconcile_store_cart(results: CartValidationResult[]): StoreCartReconciliation {
  const validations: CartValidationResult[] = []
  const removed_item_ids: string[] = []
  const changes: StoreCartChange[] = []
  for (const result of results) {
    const { item, original_item, limits } = result
    if ((result.status !== "unavailable" && result.status !== "invalid_quantity") || (result.status === "invalid_quantity" && !limits)) {
      validations.push(result)
      continue
    }
    const quantity_cap = limits ? Math.min(original_item.quantity, limits.max_quantity) : 0
    const quantity = result.status === "unavailable" || !limits || quantity_cap < limits.min_quantity
      ? 0 : limits.min_quantity + Math.floor((quantity_cap - limits.min_quantity) / limits.step_quantity) * limits.step_quantity
    if (quantity === 0) removed_item_ids.push(item.id)
    else validations.push({ ...result, item: { ...item, quantity }, status: "valid", message: undefined })
    changes.push({ item_id: item.id, title: item.title, image: item.image, selected_size: item.selected_size, previous_quantity: original_item.quantity, quantity, reason: get_cart_adjustment_reason(result, quantity) })
  }
  return { validations, removed_item_ids, changes }
}
