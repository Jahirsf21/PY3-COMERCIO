import { useEffect, useId, useState } from "react"
import { ProductSuggestionsList } from "@/components/product-suggestions-list"
import { Button } from "@/components/ui/button"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { get_history_recommendations } from "@/lib/analytics/recommendations"
import type { ProductSuggestionsResult } from "@/lib/catalog/types"
import { useStores } from "@/lib/stores/storesContext"

type HistoryRecommendationsProps = {
  excluded_product_ids?: string[]
  className?: string
}

/**
 * Sección "Recomendados para ti" con productos sugeridos según el historial del usuario o la sesión anónima:
 * las categorías de los productos vistos y las búsquedas recientes. Se usa en el catálogo y en el carrito.
 * Muestra los productos en grupos de 4, con estados de carga y error; no aparece si no hay historial ni recomendaciones.
 * @param props Propiedades de la sección.
 * @param props.excluded_product_ids Productos que no se deben recomendar, por ejemplo los del carrito.
 * @param props.className Clases adicionales para la sección.
 * @returns Sección de recomendaciones, o nada si no corresponde mostrarla.
 */
export function HistoryRecommendations({ excluded_product_ids = [], className }: HistoryRecommendationsProps) {
  const title_id = useId()
  const { viewed_products, recent_searches } = useAnalytics()
  const { selected_store } = useStores()
  const [retry_count, set_retry_count] = useState(0)
  const [result, set_result] = useState<ProductSuggestionsResult | null>(null)
  const history_key = JSON.stringify({
    viewed_products,
    recent_searches,
    excluded_product_ids: [...new Set(excluded_product_ids)].sort(),
  })
  const request_key = `${history_key}:${selected_store?.id ?? "none"}:${retry_count}`
  const has_history = viewed_products.length > 0 || recent_searches.length > 0

  useEffect(() => {
    const history: {
      viewed_products: typeof viewed_products
      recent_searches: typeof recent_searches
      excluded_product_ids: string[]
    } = JSON.parse(history_key)
    if (history.viewed_products.length === 0 && history.recent_searches.length === 0) return
    let is_effect_active = true

    get_history_recommendations(history.viewed_products, history.recent_searches, history.excluded_product_ids, selected_store)
      .then((products) => {
        if (is_effect_active) set_result({ request_key, products, has_error: false })
      })
      .catch(() => {
        if (is_effect_active) set_result({ request_key, products: [], has_error: true })
      })

    return () => { is_effect_active = false }
  }, [history_key, request_key, selected_store])

  if (!has_history) return null

  const is_loading = result?.request_key !== request_key
  const has_error = !is_loading && result.has_error
  const products = !is_loading ? result.products : []
  if (!is_loading && !has_error && products.length === 0) return null

  const title = <h2 id={title_id} className="text-xl font-semibold">Recomendados para ti</h2>

  return (
    <section aria-labelledby={title_id} aria-busy={is_loading} className={className}>
      {products.length === 0 && title}
      {is_loading ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">Cargando recomendaciones…</p>
      ) : has_error ? (
        <div className="mt-4 space-y-3">
          <p role="status" className="text-sm text-muted-foreground">No pudimos cargar las recomendaciones.</p>
          <Button type="button" variant="outline" className="cursor-pointer" onClick={() => set_retry_count((previous_count) => previous_count + 1)}>Reintentar</Button>
        </div>
      ) : (
        <ProductSuggestionsList key={request_key} products={products} title={title} list_label="Productos recomendados para ti" />
      )}
    </section>
  )
}
