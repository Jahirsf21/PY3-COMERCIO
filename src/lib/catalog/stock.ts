import type { StockByLocation } from "@/lib/catalog/types"
import type { Store } from "@/lib/stores/types"

/**
 * Combina las tallas registradas sin sumar el inventario de los locales.
 * @param stock_by_location Locales con el stock por talla de una variante.
 * @returns Tallas sin duplicados, o un arreglo vacío si la estructura es inválida.
 */
export function get_sizes_from_stock(stock_by_location: StockByLocation[]): string[] {
  if (!Array.isArray(stock_by_location)) return []
  const sizes = new Set<string>()
  for (const location of stock_by_location) {
    if (!location || !location.sizes || typeof location.sizes !== "object" || Array.isArray(location.sizes)) return []
    for (const size of Object.keys(location.sizes)) sizes.add(size)
  }
  return [...sizes]
}

/**
 * Usa el stock original de una sede; sin selección toma el mayor, nunca la suma ni reservas.
 * @param stock_by_location Locales con el inventario por talla de una variante.
 * @param selected_size Talla cuya disponibilidad se desea consultar.
 * @param selected_store Local elegido; null utiliza el mayor stock de una sola sede.
 * @returns Stock de la talla; cero si no está registrada y null si el inventario consultado es inválido.
 */
export function get_available_quantity_by_size(stock_by_location: StockByLocation[], selected_size: string, selected_store: Store | null = null): number | null {
  if (!Array.isArray(stock_by_location)) return null
  let available_quantity = 0
  for (const location of stock_by_location) {
    if (!location) return null
    if (selected_store && (location.province !== selected_store.province || location.locale_name !== selected_store.locale_name)) continue
    if (!location.sizes || typeof location.sizes !== "object" || Array.isArray(location.sizes)) return null
    if (!Object.hasOwn(location.sizes, selected_size)) continue
    const stock = location.sizes[selected_size]
    if (!stock || !Number.isSafeInteger(stock.stock_quantity) || stock.stock_quantity < 0) return null
    available_quantity = Math.max(available_quantity, stock.stock_quantity)
  }
  return available_quantity
}
