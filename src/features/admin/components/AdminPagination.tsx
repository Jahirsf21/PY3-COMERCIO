import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

/** Navegación entre las páginas de un listado administrativo. */
type AdminPaginationProps = {
  label: string
  page: number
  total_pages: number
  is_loading?: boolean
  on_page_change: (page: number) => void
}

/**
 * Permite recorrer resultados sin ofrecer páginas fuera del listado.
 * @param props Página actual y acción para cambiarla.
 * @returns Controles de paginación, o null si no hay más de una página.
 */
export function AdminPagination({ label, page, total_pages, is_loading = false, on_page_change }: AdminPaginationProps) {
  if (total_pages <= 1) return null
  return (
    <Pagination aria-label={label} className="mx-0 w-auto">
      <PaginationContent className="gap-2">
        <PaginationItem>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Página anterior"
            className="cursor-pointer" disabled={is_loading || page <= 1} onClick={() => on_page_change(page - 1)}>
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
        </PaginationItem>
        <PaginationItem className="px-0.5 text-xs font-medium tabular-nums">
          <span role="status">Página {page} de {total_pages}</span>
        </PaginationItem>
        <PaginationItem>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Página siguiente"
            className="cursor-pointer" disabled={is_loading || page >= total_pages} onClick={() => on_page_change(page + 1)}>
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
