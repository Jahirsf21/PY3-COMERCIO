import { useId, useRef, useState } from "react"
import type { FocusEvent, KeyboardEvent } from "react"
import { useSearchBox } from "react-instantsearch"
import { Input } from "@/components/ui/input"
import { RecentSearchesList } from "@/features/catalog/components/search/RecentSearchesList"
import { useAnalytics } from "@/lib/analytics/analyticsContext"

/**
 * Buscador del catálogo conectado a Algolia, que registra las búsquedas en la analítica.
 * Al enfocarlo vacío muestra las búsquedas recientes; elegir una la repite.
 * @returns Campo de búsqueda con el panel de búsquedas recientes.
 */
export function SearchInput() {
  const { query, refine } = useSearchBox();
  const { recent_searches, track_search } = useAnalytics();
  const panel_id = useId();
  const input_ref = useRef<HTMLInputElement>(null);
  const [is_focused, set_is_focused] = useState(false);
  const is_panel_open = is_focused && query === "" && recent_searches.length > 0;

  /**
   * Busca un texto en el catálogo y lo registra como búsqueda.
   * @param next_query Texto que se desea buscar.
   * @returns No retorna ningún valor.
   */
  function search(next_query: string): void {
    refine(next_query);
    track_search(next_query);
  }

  /**
   * Repite una búsqueda reciente y deja el foco en el buscador.
   * @param recent_query Búsqueda elegida.
   * @returns No retorna ningún valor.
   */
  function select_recent_search(recent_query: string): void {
    search(recent_query);
    input_ref.current?.focus();
  }

  /**
   * Cierra el panel cuando el foco sale del buscador y de sus búsquedas recientes.
   * @param event Evento de pérdida de foco.
   * @returns No retorna ningún valor.
   */
  function handle_blur(event: FocusEvent<HTMLDivElement>): void {
    if (!event.currentTarget.contains(event.relatedTarget)) set_is_focused(false);
  }

  /**
   * Con la flecha abajo pasa a la primera búsqueda reciente; con Escape cierra el panel.
   * @param event Evento de teclado del buscador.
   * @returns No retorna ningún valor.
   */
  function handle_key_down(event: KeyboardEvent<HTMLInputElement>): void {
    if (!is_panel_open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      document.getElementById(panel_id)?.querySelector<HTMLButtonElement>("button")?.focus();
    }
    if (event.key === "Escape") set_is_focused(false);
  }

  return (
    <div className="relative" onFocus={() => set_is_focused(true)} onBlur={handle_blur}>
      <Input
        ref={input_ref}
        aria-label="Buscar productos"
        aria-controls={is_panel_open ? panel_id : undefined}
        aria-expanded={is_panel_open}
        className="h-12 px-4 text-base transition-colors duration-150 hover:border-ring motion-reduce:transition-none md:text-base"
        value={query}
        onChange={(e) => search(e.target.value)}
        onKeyDown={handle_key_down}
        onClick={() => set_is_focused(true)}
        placeholder="Buscar productos..."
      />
      {is_panel_open && (
        <RecentSearchesList
          id={panel_id}
          searches={recent_searches}
          on_select={select_recent_search}
          on_escape={() => {
            input_ref.current?.focus();
            set_is_focused(false);
          }}
        />
      )}
    </div>
  );
}
