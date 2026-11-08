import type { KeyboardEvent } from "react"
import { HistoryIcon } from "lucide-react"
import type { RecentSearch } from "@/lib/analytics/types"

type RecentSearchesListProps = {
  id: string
  searches: RecentSearch[]
  on_select: (query: string) => void
  on_escape: () => void
}

/**
 * Panel con las búsquedas recientes del usuario o la sesión anónima, debajo del buscador.
 * Cada búsqueda es un botón que la repite. Las flechas arriba y abajo recorren las búsquedas y Escape cierra el panel.
 * @param props Propiedades del panel.
 * @param props.id Identificador del panel, referenciado por el buscador con aria-controls.
 * @param props.searches Búsquedas de la más reciente a la más antigua.
 * @param props.on_select Acción que recibe la búsqueda elegida.
 * @param props.on_escape Acción que cierra el panel y devuelve el foco al buscador.
 * @returns Panel de búsquedas recientes.
 */
export function RecentSearchesList({ id, searches, on_select, on_escape }: RecentSearchesListProps) {
  /**
   * Mueve el foco entre las búsquedas con las flechas y cierra el panel con Escape.
   * @param event Evento de teclado de una búsqueda.
   * @returns No retorna ningún valor.
   */
  function handle_key_down(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "Escape") {
      event.preventDefault()
      on_escape()
      return
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    event.preventDefault()
    const items = [...(event.currentTarget.closest("ul")?.querySelectorAll<HTMLButtonElement>("button") ?? [])]
    const index = items.indexOf(event.currentTarget)
    if (event.key === "ArrowUp" && index === 0) {
      on_escape()
      return
    }
    items[Math.min(Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0), items.length - 1)]?.focus()
  }

  return (
    <div
      id={id}
      className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-input bg-popover text-popover-foreground shadow-md"
    >
      <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">Búsquedas recientes</p>
      <ul aria-label="Búsquedas recientes" className="pb-1">
        {searches.map((search) => (
          <li key={search.query}>
            <button
              type="button"
              onClick={() => on_select(search.query)}
              onKeyDown={handle_key_down}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 px-3 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <HistoryIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{search.query}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
