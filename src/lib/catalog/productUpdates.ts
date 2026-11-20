import { get_product_indices, search_client, write_api_key } from "@/lib/algolia/algolia"
import type { User } from "@/lib/auth/types"
import { get_inventory_rows } from "@/lib/catalog/adminInventory"
import type { ProductRecord } from "@/lib/catalog/types"
import type { SalesChannel } from "@/lib/channel/types"
import { get_stored_json, is_non_negative_integer, is_positive_integer, is_record, is_valid_price } from "@/lib/shared/utils"
import type { Store } from "@/lib/stores/types"

export const commercial_fields = { price: "Precio base", min_order_quantity: "Cantidad mínima", max_order_quantity: "Cantidad máxima", step_quantity: "Paso de compra" }
/** Campo y valor observado antes de abrir el formulario. */
export type EditTarget = { sku: string; channel: SalesChannel } & (
  { field: keyof typeof commercial_fields; before: number } |
  { field: "stock"; store: Store; size: string; before: number }
)
const history_key = "space-shop-product-changes:v1"

/** Valida el texto antes de convertirlo para no aceptar decimales ni exponentes.
 * @param field Campo que se edita. @param raw Texto del formulario. @returns Mensaje o cadena vacía.
 */
export function validate_edit_value(field: EditTarget["field"], raw: string): string {
  const value = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value)) {
    return field === "price" ? "Ingresa el precio en colones enteros, sin decimales ni separadores." : "Ingresa una cantidad entera, sin signos ni decimales."
  }
  if (field === "price" && !is_valid_price(value)) return "El precio supera el máximo permitido."
  if (field !== "stock" && field !== "price" && value < 1) return "La cantidad debe ser al menos 1."
  return ""
}

/** Describe el dato editado. @param target Campo o talla elegida. @returns Etiqueta del historial. */
export function describe_target(target: EditTarget): string {
  return target.field === "stock" ? `${target.store.locale_name} · Talla ${target.size}` : commercial_fields[target.field]
}

/** Lee el historial local del administrador. @param user Sesión actual. @returns Entradas legibles de la más reciente a la más antigua. */
export function get_product_history(user: User): string[] {
  const data = get_stored_json(`${history_key}:${user.id}`)
  return Array.isArray(data) ? data.filter((item): item is string => typeof item === "string") : []
}

/** Registra el resultado del intento de edición. @param user Administrador. @param text Resumen. @returns Si se pudo guardar el historial. */
function record_change(user: User, text: string): boolean {
  try {
    localStorage.setItem(`${history_key}:${user.id}`, JSON.stringify([`${new Date().toLocaleString("es-CR")} · ${text}`, ...get_product_history(user)]))
    return true
  } catch { return false }
}

/**
 * Construye la actualización parcial a partir del registro recién leído.
 * @param record Variante actual del índice.
 * @param target Campo que vio el administrador.
 * @param next Nuevo valor.
 * @returns Solo los atributos afectados.
 * @throws Si cambió el dato original o la modificación no es válida.
 */
export function prepare_product_update(record: ProductRecord, target: EditTarget, next: number): Partial<ProductRecord> {
  const stale = "El dato cambió mientras editabas. Revisa el valor actualizado antes de volver a editar."
  const validation = validate_edit_value(target.field, String(next))
  if (validation) throw new Error(validation)
  if (record.sku !== target.sku) throw new Error(stale)
  if (next === target.before) throw new Error("Ingresa un valor diferente del actual.")
  if (target.field !== "stock") {
    if (record[target.field] !== target.before) throw new Error(stale)
    if (target.field === "price" ? !is_valid_price(next) : !is_positive_integer(next)) throw new Error("Ingresa un valor válido.")
    const min = target.field === "min_order_quantity" ? next : record.min_order_quantity
    const max = target.field === "max_order_quantity" ? next : record.max_order_quantity
    if (min > max) throw new Error("La cantidad mínima no puede superar la máxima.")
    return { [target.field]: next }
  }
  if (!is_non_negative_integer(next)) throw new Error("Las existencias deben ser un entero de cero en adelante.")
  const [row] = get_inventory_rows([record])
  if (row.sizes.get(target.store.id)?.[target.size] !== target.before) throw new Error(stale)
  const stock_by_location = record.stock_by_location.map((loc) =>
    loc.province === target.store.province && loc.locale_name === target.store.locale_name
      ? { ...loc, sizes: { ...loc.sizes, [target.size]: { ...loc.sizes[target.size], stock_quantity: next } } } : loc)
  const available = stock_by_location.filter((loc) => Object.values(loc.sizes).some((s) => s.stock_quantity > 0))
  return { stock_by_location, in_stock: available.length > 0, provinces: [...new Set(available.map((loc) => loc.province))] }
}

/**
 * Actualiza un SKU existente, espera su publicación y registra el resultado local.
 * @param user Sesión del administrador.
 * @param target Variante y campo original.
 * @param next Valor propuesto.
 * @returns Resumen del cambio confirmado.
 * @throws Si la modificación es inválida o no se pudo confirmar.
 */
export async function save_product_update(user: User, target: EditTarget, next: number): Promise<string> {
  if (user.role !== "ADMIN") throw new Error("Se necesita acceso de edición del catálogo.")
  if (!write_api_key) throw new Error("La escritura de productos no está configurada.")
  const indexName = get_product_indices(target.channel).main
  const app = import.meta.env.VITE_ALGOLIA_APPLICATION_ID
  if (!app || !indexName) throw new Error("El índice de productos no está configurado.")
  const { algoliasearch } = await import("algoliasearch")
  const reader = algoliasearch(app, import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY)
  const params = { indexName, objectID: target.sku }
  const record = await reader.getObject<ProductRecord>(params).catch(() => { throw new Error("No pudimos consultar el valor actual del producto.") })
  const summary = `${target.channel.toUpperCase()} · ${target.sku} · ${describe_target(target)}: ${target.before} → ${next}`
  const writer = algoliasearch(app, write_api_key)
  let accepted = false
  let attempted = false
  try {
    const attributesToUpdate = prepare_product_update(record, target, next)
    attempted = true
    const { taskID } = await writer.partialUpdateObject({ ...params, attributesToUpdate, createIfNotExists: false })
    accepted = true
    if (is_non_negative_integer(taskID)) {
      // Si falla la consulta de la tarea, el registro publicado aún puede confirmar el resultado.
      await writer.waitForTask({ indexName, taskID, maxRetries: 12 }).catch(() => undefined)
    }
    let confirmed = false
    for (const delay of [0, 250, 750, 1500]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
      const published = await reader.getObject<ProductRecord>(params).catch(() => null)
      if (!published || published.sku !== target.sku) continue
      const value = target.field === "stock" ? get_inventory_rows([published])[0].sizes.get(target.store.id)?.[target.size] : published[target.field]
      if (value === next) { confirmed = true; break }
    }
    if (!confirmed) throw new Error()
  } catch (error) {
    if (!attempted) throw error
    const message = accepted ? "Algolia recibió el cambio, pero todavía no pudimos verificar el nuevo valor. Revisa el listado antes de repetirlo." :
      is_record(error) && error.status === 403 ? "Algolia denegó el permiso de escritura en este índice." :
      is_record(error) && error.status === 400 ? "Algolia rechazó los datos del cambio." : "No pudimos confirmar si Algolia recibió el cambio. Vuelve a consultar antes de repetirlo."
    record_change(user, `${message} ${summary}`)
    throw new Error(message, { cause: error })
  } finally {
    await search_client.clearCache()
  }
  const saved = record_change(user, `Actualizado · ${summary}`)
  return `Actualizado · ${summary}${saved ? "" : " (no se pudo guardar el historial local)"}`
}
