import { InstantSearch } from "react-instantsearch"
import { get_product_indices, search_client } from "@/lib/algolia/algolia"
import { useChannel } from "@/lib/channel/channelContext"
import { SearchBar } from "@/features/catalog/components/search/SearchBar"
import { FilterPanel } from "@/features/catalog/components/filters/FilterPanel"
import { ResultsPanel } from "@/features/catalog/components/results/ResultsPanel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShopHeader } from "@/components/shop-header"

/**
 * Catálogo de productos del canal de venta activo, con búsqueda, filtros y resultados.
 * Al cambiar de canal se reinicia la búsqueda para consultar los índices del nuevo canal.
 * Los filtros se muestran dos veces (columna de escritorio y panel móvil); preserveSharedStateOnUnmount
 * evita que se pierdan al cerrar el panel móvil, que desmonta su copia de los filtros.
 * @returns Página del catálogo.
 */
export default function Catalog() {
  const { channel } = useChannel()
  return (
    <InstantSearch
      key={channel}
      indexName={get_product_indices(channel).main}
      searchClient={search_client}
      routing
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <div className="flex h-dvh flex-col">
        <ShopHeader />
        <div className="shrink-0 border-b border-input px-4 py-4 lg:px-6">
          <SearchBar />
        </div>
        <div className="flex min-h-0 flex-1 gap-6 overflow-hidden p-4 lg:p-6">
          <ScrollArea className="hidden w-64 shrink-0 lg:block">
            <FilterPanel />
          </ScrollArea>
          <ResultsPanel />
        </div>
      </div>
    </InstantSearch>
  );
}
