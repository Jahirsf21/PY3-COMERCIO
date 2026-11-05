import { algolia_indices, search_client } from "@/lib/algolia/algolia"
import { get_cart_quantity_limits, get_cart_validation_error, validate_cart_item } from "@/lib/cart/cart"
import type { CartItem, CartQuantityLimits, CartValidationResult } from "@/lib/cart/types"
import type { ProductHit, ProductRecord } from "@/lib/catalog/types"
import { get_available_quantity_by_size } from "@/lib/catalog/stock"
import { get_suggestions } from "@/lib/shared/suggestions"
import type { Store } from "@/lib/stores/types"

export { get_available_quantity_by_size, get_sizes_from_stock } from "@/lib/catalog/stock"

/**
 * Obtiene las variantes de un producto desde el índice principal de Algolia, sin usar la caché del cliente.
 * @param product_id Identificador del producto.
 * @returns Variantes del producto; vacío si no hay product_id o coincidencias.
 * @throws Si falla la consulta o la respuesta no contiene un arreglo de hits.
 */
export async function get_product_variants(product_id: string): Promise<ProductHit[]> {
  if (!product_id) return []
  const product_id_filter_value = product_id.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  const { data: { results } } = await search_client.searchWithHTTPInfo<ProductRecord>({
    requests: [{
      indexName: algolia_indices.main,
      query: "",
      filters: `product_id:"${product_id_filter_value}"`,
      distinct: false,
      hitsPerPage: 50,
    }],
  })
  const search_result = results[0]
  if (!search_result || !("hits" in search_result) || !Array.isArray(search_result.hits)) throw new Error("Respuesta de catálogo inválida.")
  return search_result.hits as ProductHit[]
}

/**
 * Consulta hasta 20 productos sugeridos que comparten alguna categoría con el producto mediante get_suggestions().
 * Excluye el producto actual de las sugerencias.
 * @param product Identificador y categorías del producto.
 * @param selected_store Tienda para comprobar las sugerencias; null usa el mayor stock de una sede.
 * @returns Hasta 20 variantes sugeridas; vacío si no hay categorías válidas o productos disponibles.
 * @throws Si falla la consulta a Algolia o su respuesta no contiene resultados válidos.
 */
export async function get_product_suggestions(product: Pick<ProductRecord, "product_id" | "categories">, selected_store: Store | null = null): Promise<ProductHit[]> {
  if (typeof product.product_id !== "string" || !product.product_id.trim() || !Array.isArray(product.categories)) return []
  return get_suggestions(product.categories, [product.product_id.trim()], selected_store)
}

/**
 * Consulta los límites de cantidad de una variante y talla con los datos actuales del catálogo.
 * @param product_id Identificador del producto.
 * @param sku SKU de la variante.
 * @param selected_size Talla seleccionada.
 * @param selected_store Local elegido; null utiliza el mayor stock de una sola sede.
 * @returns Límites de cantidad, o null si la variante no existe, no se vende en B2C o sus reglas o stock son inválidos.
 * @throws Si falla la consulta de variantes o la respuesta no contiene un arreglo de hits.
 */
export async function get_catalog_quantity_limits(product_id: string, sku: string, selected_size: string, selected_store: Store | null = null): Promise<CartQuantityLimits | null> {
  const variants = await get_product_variants(product_id)
  const variant = variants.find((product) => product.product_id === product_id && product.sku === sku)
  if (!variant || !Array.isArray(variant.sales_channels) || !variant.sales_channels.includes("b2c")) return null
  return get_cart_quantity_limits(variant, get_available_quantity_by_size(variant.b2c_stock_by_location, selected_size, selected_store))
}

/**
 * Valida las líneas del carrito con los datos actuales del catálogo.
 * Por cada producto:
 * - Consulta sus variantes una sola vez para todas sus líneas.
 * - Comprueba el stock original de la talla en una única sede, sin sumar locales.
 * - Valida cada línea mediante validate_cart_item().
 * Si falla la consulta de un producto o su stock es inconsistente, marca sus líneas con get_cart_validation_error().
 * @param cart Líneas del carrito.
 * @param selected_store Tienda usada para validar todas las líneas; null utiliza el mayor stock de una sede.
 * @returns Resultado de validación de cada línea.
 *   original_item: línea recibida.
 *   item: línea con los datos actualizados.
 *   status / limits / message: estado, límites y mensaje de la validación.
 */
export async function get_cart_validation(cart: CartItem[], selected_store: Store | null = null): Promise<CartValidationResult[]> {
  const product_ids = [...new Set(cart.map((item) => item.product_id))]
  const variant_responses = await Promise.allSettled(product_ids.map((product_id) => get_product_variants(product_id)))
  const responses_by_product_id = new Map(product_ids.map((product_id, response_index) => [product_id, variant_responses[response_index]]))
  return cart.map((item) => {
    const variant_response = responses_by_product_id.get(item.product_id)
    if (!variant_response || variant_response.status === "rejected") return get_cart_validation_error(item)
    const variant = variant_response.value.find((product) => product?.product_id === item.product_id && product.sku === item.sku)
    if (!variant || !Array.isArray(variant.sales_channels) || !variant.sales_channels.includes("b2c")) {
      return validate_cart_item(item, variant, 0)
    }
    try {
      const available_quantity = get_available_quantity_by_size(variant.b2c_stock_by_location, item.selected_size, selected_store)
      if (available_quantity === null) return get_cart_validation_error(item)
      return validate_cart_item(item, variant, available_quantity)
    } catch {
      return get_cart_validation_error(item)
    }
  })
}
