import { algolia_indices, search_client } from "@/lib/algolia/algolia"
import type { RecentSearch, ViewedProduct } from "@/lib/analytics/types"
import type { ProductHit, ProductRecord } from "@/lib/catalog/types"
import { get_suggestions } from "@/lib/shared/suggestions"
import { get_suggestion_categories, is_product_suggestion_available } from "@/lib/shared/utils"
import type { Store } from "@/lib/stores/types"

const max_recommendations = 20
const max_search_sources = 3

/**
 * Ordena las categorías de los productos vistos por la cantidad de productos en que aparecen y, ante un empate,
 * por la vista más reciente. Descarta las categorías genéricas mediante get_suggestion_categories().
 * @param viewed_products Productos vistos del más reciente al más antiguo.
 * @returns Categorías sin repetir, de la más relevante a la menos relevante.
 */
export function get_history_categories(viewed_products: ViewedProduct[]): string[] {
  const scores = new Map<string, { category: string; count: number; first_index: number }>()
  viewed_products.forEach((viewed_product, index) => {
    for (const category of get_suggestion_categories(viewed_product.categories)) {
      const key = category.toLocaleLowerCase("es")
      const score = scores.get(key)
      if (score) score.count += 1
      else scores.set(key, { category, count: 1, first_index: index })
    }
  })
  return [...scores.values()]
    .sort((first, second) => second.count - first.count || first.first_index - second.first_index)
    .map((score) => score.category)
}

/**
 * Busca productos disponibles con el texto de una búsqueda reciente, sin usar la caché del cliente.
 * @param query Texto de la búsqueda.
 * @param selected_store Tienda en la que deben estar disponibles; null usa el mayor stock de una sede.
 * @returns Productos disponibles que coinciden con la búsqueda.
 * @throws Si falla la consulta o la respuesta no contiene un arreglo de hits.
 */
async function search_available_products(query: string, selected_store: Store | null): Promise<ProductHit[]> {
  const { data: { results } } = await search_client.searchWithHTTPInfo<ProductRecord>({
    requests: [{ indexName: algolia_indices.main, query, hitsPerPage: max_recommendations }],
  })
  const search_result = results[0]
  if (!search_result || !("hits" in search_result) || !Array.isArray(search_result.hits)) throw new Error("Respuesta de búsqueda inválida.")
  return (search_result.hits as ProductHit[]).filter((product) => is_product_suggestion_available(product, selected_store))
}

/**
 * Obtiene hasta 20 recomendaciones a partir del historial del usuario o de la sesión anónima.
 * Primero usa las categorías de los productos vistos con get_suggestions() y, si faltan resultados,
 * completa con productos de las 3 búsquedas más recientes.
 * Nunca recomienda productos ya vistos, productos excluidos ni dos variantes del mismo producto.
 * @param viewed_products Productos vistos del más reciente al más antiguo.
 * @param recent_searches Búsquedas de la más reciente a la más antigua.
 * @param excluded_product_ids Productos que no se deben recomendar, por ejemplo los del carrito.
 * @param selected_store Tienda en la que deben estar disponibles; null usa el mayor stock de una sede.
 * @returns Recomendaciones disponibles; vacío si no hay historial.
 * @throws Si falla una consulta a Algolia o su respuesta no contiene resultados válidos.
 */
export async function get_history_recommendations(
  viewed_products: ViewedProduct[],
  recent_searches: RecentSearch[],
  excluded_product_ids: string[] = [],
  selected_store: Store | null = null,
): Promise<ProductHit[]> {
  const excluded_ids = new Set([...viewed_products.map((product) => product.product_id), ...excluded_product_ids])
  const categories = get_history_categories(viewed_products)
  const recommendations = categories.length > 0 ? await get_suggestions(categories, [...excluded_ids], selected_store) : []
  const recommended_ids = new Set(recommendations.map((product) => product.product_id))

  for (const recent_search of recent_searches.slice(0, max_search_sources)) {
    if (recommendations.length >= max_recommendations) break
    for (const product of await search_available_products(recent_search.query, selected_store)) {
      if (excluded_ids.has(product.product_id) || recommended_ids.has(product.product_id)) continue
      recommended_ids.add(product.product_id)
      recommendations.push(product)
      if (recommendations.length >= max_recommendations) break
    }
  }
  return recommendations.slice(0, max_recommendations)
}
