import { get_product_indices } from "@/lib/algolia/algolia"
import type { User } from "@/lib/auth/types"
import { read_admin_variants } from "@/lib/catalog/adminCatalog"
import type { SalesChannel } from "@/lib/channel/types"
import type { ProductImage } from "@/lib/catalog/types"
import { is_non_negative_integer, is_nonempty_string, is_record, is_valid_image } from "@/lib/shared/utils"
import { get_store_groups } from "@/lib/stores/stores"

/** Existencias de una variante por identificador de sucursal. */
export type InventoryRow = { sku: string; title: string; image: ProductImage | null; quantities: Map<string, number>; sizes: Map<string, Record<string, number>> }

export const inventory_stores = get_store_groups().flatMap((group) => group.stores)

/**
 * Suma las tallas dentro de cada sede y conserva las sedes sin registro como ausentes.
 * @param hits Variantes de un único canal.
 * @returns Filas ordenadas para la matriz de inventario.
 * @throws Si hay datos inválidos o duplicados.
 */
export function get_inventory_rows(hits: unknown[]): InventoryRow[] {
  const rows = new Map<string, InventoryRow>()
  const error = "El inventario contiene datos inválidos."
  for (const hit of hits) {
    if (!is_record(hit) || !is_nonempty_string(hit.sku) || !is_nonempty_string(hit.title) ||
      !Array.isArray(hit.stock_by_location) || rows.has(hit.sku)) throw new Error(error)
    const quantities = new Map<string, number>()
    const sizes = new Map<string, Record<string, number>>()
    for (const location of hit.stock_by_location) {
      if (!is_record(location) || !is_record(location.sizes) || Array.isArray(location.sizes)) throw new Error(error)
      const store = inventory_stores.find((item) => item.province === location.province && item.locale_name === location.locale_name)
      if (!store || quantities.has(store.id)) throw new Error(error)
      let total = 0
      const entries: [string, number][] = []
      for (const [name, size] of Object.entries(location.sizes)) {
        if (!is_record(size) || !is_non_negative_integer(size.stock_quantity)) throw new Error(error)
        entries.push([name, size.stock_quantity])
        total += size.stock_quantity
      }
      quantities.set(store.id, total)
      sizes.set(store.id, Object.fromEntries(entries))
    }
    rows.set(hit.sku, { sku: hit.sku, title: hit.title, image: is_valid_image(hit.image) ? hit.image : null, quantities, sizes })
  }
  return [...rows.values()].sort((a, b) => a.title.localeCompare(b.title, "es") || a.sku.localeCompare(b.sku, "es"))
}

/**
 * Lee el inventario de todas las variantes del canal solicitado por el administrador.
 * @param user Sesión activa.
 * @param channel Canal de inventario.
 * @returns Matriz de variantes por sucursal.
 * @throws Si falta autorización o no se puede leer el índice completo.
 */
export async function get_admin_inventory(user: User | null, channel: SalesChannel): Promise<InventoryRow[]> {
  if (user?.role !== "ADMIN") throw new Error("Solo el administrador puede consultar este inventario.")
  const indexName = get_product_indices(channel).main
  if (!indexName) throw new Error("El inventario no está configurado.")
  const [hits] = await read_admin_variants([indexName], ["title", "sku", "image", "stock_by_location"])
  return get_inventory_rows(hits)
}
