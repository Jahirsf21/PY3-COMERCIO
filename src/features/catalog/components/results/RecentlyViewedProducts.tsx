import { useEffect, useState } from "react"
import { ProductSuggestionsList } from "@/components/product-suggestions-list"
import { Button } from "@/components/ui/button"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { get_products_by_variants } from "@/lib/catalog/catalog"
import type { ProductSuggestionsResult } from "@/lib/catalog/types"

/**
 * Sección "Vistos recientemente" del inicio del catálogo, con los últimos productos que vio el usuario o la sesión anónima.
 * Consulta en Algolia los datos actuales de cada producto y los muestra en grupos de 4.
 * CatalogHistorySections decide cuándo se muestra en el catálogo.
 * @returns Sección de productos vistos recientemente, o nada si no hay productos vistos.
 */
export function RecentlyViewedProducts() {
  const { viewed_products } = useAnalytics()
  const [retry_count, set_retry_count] = useState(0)
  const [result, set_result] = useState<ProductSuggestionsResult | null>(null)
  const variants_key = JSON.stringify(viewed_products.map(({ product_id, sku }) => ({ product_id, sku })))
  const request_key = `${variants_key}:${retry_count}`
  const has_history = viewed_products.length > 0

  useEffect(() => {
    const variants: { product_id: string; sku: string }[] = JSON.parse(variants_key)
    if (variants.length === 0) return
    let is_effect_active = true

    get_products_by_variants(variants)
      .then((products) => {
        if (is_effect_active) set_result({ request_key, products, has_error: false })
      })
      .catch(() => {
        if (is_effect_active) set_result({ request_key, products: [], has_error: true })
      })

    return () => { is_effect_active = false }
  }, [variants_key, request_key])

  if (!has_history) return null

  const is_loading = result?.request_key !== request_key
  const has_error = !is_loading && result.has_error
  const products = !is_loading ? result.products : []
  if (!is_loading && !has_error && products.length === 0) return null

  const title = <h2 id="recently-viewed-title" className="text-xl font-semibold">Vistos recientemente</h2>

  return (
    <section aria-labelledby="recently-viewed-title" aria-busy={is_loading} className="mb-8">
      {products.length === 0 && title}
      {is_loading ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">Cargando productos vistos…</p>
      ) : has_error ? (
        <div className="mt-4 space-y-3">
          <p role="status" className="text-sm text-muted-foreground">No pudimos cargar los productos que viste.</p>
          <Button type="button" variant="outline" className="cursor-pointer" onClick={() => set_retry_count((previous_count) => previous_count + 1)}>Reintentar</Button>
        </div>
      ) : (
        <ProductSuggestionsList key={request_key} products={products} title={title} list_label="Productos vistos recientemente" />
      )}
    </section>
  )
}
