import type { CartValidationResult } from "@/lib/cart/types"
import { get_product_variants } from "@/lib/catalog/catalog"
import { get_available_quantity_by_size } from "@/lib/catalog/stock"
import type { Store, StoreCartChange, StoreCartProduct, StoreCartReconciliation, StoreGroup } from "@/lib/stores/types"

// Los nombres coinciden con b2c_stock_by_location del catálogo.
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
 * Elige una sola sede con la mayor suma de stock original de las variantes y tallas del carrito.
 * No suma inventarios entre sedes ni limita la puntuación a las cantidades solicitadas.
 * Los empates conservan el orden del registro de tiendas.
 * @param products Variantes y tallas presentes en el carrito.
 * @returns Promesa con la tienda elegida, o null si el carrito está vacío.
 * @throws Si falla una consulta del catálogo o el inventario consultado es inválido.
 */
export async function get_best_cart_store(products: StoreCartProduct[]): Promise<Store | null> {
  if (products.length === 0) return null
  const unique_products = [...new Map(products.map((product) => [JSON.stringify([product.product_id, product.sku, product.selected_size]), product])).values()]
  const product_ids = [...new Set(unique_products.map((product) => product.product_id))]
  const responses = await Promise.all(product_ids.map((product_id) => get_product_variants(product_id)))
  const variants_by_product = new Map(product_ids.map((product_id, index) => [product_id, responses[index]]))
  const variants = unique_products.map((product) => {
    const variant = variants_by_product.get(product.product_id)?.find((candidate) => candidate.product_id === product.product_id && candidate.sku === product.sku)
    if (!variant || !Array.isArray(variant.sales_channels) || !variant.sales_channels.includes("b2c")) return null
    if (get_available_quantity_by_size(variant.b2c_stock_by_location, product.selected_size) === null) throw new Error("Inventario inválido para elegir la tienda.")
    return { variant, selected_size: product.selected_size }
  })
  let best_store: Store | null = null
  let best_stock = -1
  for (const store of stores) {
    let total_stock = 0
    for (const product of variants) {
      if (!product) continue
      const stock = get_available_quantity_by_size(product.variant.b2c_stock_by_location, product.selected_size, store)
      if (stock === null || !Number.isSafeInteger(total_stock + stock)) throw new Error("Inventario inválido para elegir la tienda.")
      total_stock += stock
    }
    if (total_stock > best_stock) {
      best_store = store
      best_stock = total_stock
    }
  }
  return best_store
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
    changes.push({ item_id: item.id, title: item.title, image: item.image, selected_size: item.selected_size, previous_quantity: original_item.quantity, quantity })
  }
  return { validations, removed_item_ids, changes }
}
