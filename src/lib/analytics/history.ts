import type { RecentSearch, ViewedProduct } from "@/lib/analytics/types"
import { get_stored_json, get_user_storage_key, is_nonempty_string, is_record, is_string_list, is_valid_date, save_stored_list } from "@/lib/shared/utils"

const max_history_items = 10

/**
 * Valida los productos vistos guardados y descarta los que tengan datos incorrectos o estén repetidos.
 * @param history_data Contenido guardado en localStorage.
 * @returns Productos vistos del más reciente al más antiguo, como máximo 10.
 */
export function parse_viewed_products(history_data: unknown): ViewedProduct[] {
  if (!Array.isArray(history_data)) return []
  const product_ids = new Set<string>()
  const viewed_products: ViewedProduct[] = []
  for (const item of history_data) {
    if (!is_record(item)) continue
    const { product_id, sku, title, categories, viewed_at } = item
    if (!is_nonempty_string(product_id) || !is_nonempty_string(sku) || !is_nonempty_string(title) || !is_valid_date(viewed_at)) continue
    if (!is_string_list(categories) || product_ids.has(product_id)) continue
    product_ids.add(product_id)
    viewed_products.push({ product_id, sku, title, categories, viewed_at })
  }
  return viewed_products.slice(0, max_history_items)
}

/**
 * Valida las búsquedas recientes guardadas y descarta las que tengan datos incorrectos o estén repetidas.
 * @param history_data Contenido guardado en localStorage.
 * @returns Búsquedas de la más reciente a la más antigua, como máximo 10.
 */
export function parse_recent_searches(history_data: unknown): RecentSearch[] {
  if (!Array.isArray(history_data)) return []
  const queries = new Set<string>()
  const recent_searches: RecentSearch[] = []
  for (const item of history_data) {
    if (!is_record(item)) continue
    const { query, searched_at } = item
    if (!is_nonempty_string(query) || !is_valid_date(searched_at)) continue
    const query_key = query.toLocaleLowerCase("es")
    if (queries.has(query_key)) continue
    queries.add(query_key)
    recent_searches.push({ query, searched_at })
  }
  return recent_searches.slice(0, max_history_items)
}

/**
 * Obtiene los productos vistos de un usuario o sesión anónima y los valida mediante parse_viewed_products().
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @returns Productos vistos, o un arreglo vacío si no se pueden recuperar.
 */
export function get_stored_viewed_products(owner_id: string): ViewedProduct[] {
  return parse_viewed_products(get_stored_json(get_user_storage_key("space-shop-viewed-products", owner_id)))
}

/**
 * Guarda los productos vistos de un usuario o sesión anónima en localStorage.
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @param viewed_products Productos vistos del más reciente al más antiguo.
 * @returns true si se guardaron; false si el navegador rechaza la operación.
 */
export function save_viewed_products(owner_id: string, viewed_products: ViewedProduct[]): boolean {
  return save_stored_list(get_user_storage_key("space-shop-viewed-products", owner_id), viewed_products)
}

/**
 * Obtiene las búsquedas recientes de un usuario o sesión anónima y las valida mediante parse_recent_searches().
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @returns Búsquedas recientes, o un arreglo vacío si no se pueden recuperar.
 */
export function get_stored_recent_searches(owner_id: string): RecentSearch[] {
  return parse_recent_searches(get_stored_json(get_user_storage_key("space-shop-recent-searches", owner_id)))
}

/**
 * Guarda las búsquedas recientes de un usuario o sesión anónima en localStorage.
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @param recent_searches Búsquedas de la más reciente a la más antigua.
 * @returns true si se guardaron; false si el navegador rechaza la operación.
 */
export function save_recent_searches(owner_id: string, recent_searches: RecentSearch[]): boolean {
  return save_stored_list(get_user_storage_key("space-shop-recent-searches", owner_id), recent_searches)
}

/**
 * Agrega un producto visto al inicio del historial. Si el producto ya estaba, lo mueve al inicio con la última variante vista.
 * @param viewed_products Productos vistos del más reciente al más antiguo.
 * @param viewed_product Producto que se acaba de ver.
 * @returns Historial nuevo con como máximo 10 productos.
 */
export function add_viewed_product(viewed_products: ViewedProduct[], viewed_product: ViewedProduct): ViewedProduct[] {
  return [viewed_product, ...viewed_products.filter((item) => item.product_id !== viewed_product.product_id)].slice(0, max_history_items)
}

/**
 * Agrega una búsqueda al inicio del historial. Si ya estaba, sin distinguir mayúsculas, la mueve al inicio.
 * @param recent_searches Búsquedas de la más reciente a la más antigua.
 * @param recent_search Búsqueda que se acaba de registrar.
 * @returns Historial nuevo con como máximo 10 búsquedas.
 */
export function add_recent_search(recent_searches: RecentSearch[], recent_search: RecentSearch): RecentSearch[] {
  const query_key = recent_search.query.toLocaleLowerCase("es")
  return [recent_search, ...recent_searches.filter((item) => item.query.toLocaleLowerCase("es") !== query_key)].slice(0, max_history_items)
}
