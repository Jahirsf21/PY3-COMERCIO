import { useCurrentRefinements, usePagination, useSearchBox } from "react-instantsearch"
import { HistoryRecommendations } from "@/features/catalog/components/results/HistoryRecommendations"
import { RecentlyViewedProducts } from "@/features/catalog/components/results/RecentlyViewedProducts"
import { useAnalytics } from "@/lib/analytics/analyticsContext"

/**
 * Secciones personalizadas del inicio del catálogo: "Vistos recientemente" y "Recomendados para ti",
 * seguidas del título "Todos los productos" que marca el inicio de los resultados.
 * Solo aparecen cuando hay historial y el catálogo está en su vista inicial: sin búsqueda, sin filtros y en la primera página.
 * @returns Secciones del historial, o nada si no corresponde mostrarlas.
 */
export function CatalogHistorySections() {
  const { viewed_products, recent_searches } = useAnalytics()
  const { query } = useSearchBox()
  const { items: refinements } = useCurrentRefinements()
  const { currentRefinement: current_page } = usePagination()
  const is_initial_view = query.trim() === "" && refinements.length === 0 && current_page === 0
  const has_history = viewed_products.length > 0 || recent_searches.length > 0

  if (!is_initial_view || !has_history) return null

  return (
    <>
      <RecentlyViewedProducts />
      <HistoryRecommendations className="mb-8" />
      <h2 className="mb-4 text-xl font-semibold">Todos los productos</h2>
    </>
  )
}
