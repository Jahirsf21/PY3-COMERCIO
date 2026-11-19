import { useEffect, useState } from "react"
import { PackageOpenIcon, RotateCcwIcon, SearchIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminCatalogTable } from "@/features/admin/components/AdminCatalogTable"
import { AdminPagination } from "@/features/admin/components/AdminPagination"
import type { User } from "@/lib/auth/types"
import { get_admin_catalog, get_admin_catalog_page } from "@/lib/catalog/adminCatalog"
import type { AdminCatalogVariant } from "@/lib/catalog/types"

/** Respuesta del catálogo asociada a una sesión y a un intento. */
type CatalogResponse = { user: User; attempt: number; variants: AdminCatalogVariant[] | null }

/**
 * Consulta y compara las variantes ofrecidas en ambos canales sin modificar el catálogo.
 * @param props Sesión ADMIN autorizada por el panel.
 * @returns Búsqueda y listado paginado de precios y condiciones por SKU.
 */
export function AdminCatalogPanel({ user }: { user: User }) {
  const [query, set_query] = useState("")
  const [page, set_page] = useState(1)
  const [attempt, set_attempt] = useState(0)
  const [response, set_response] = useState<CatalogResponse | null>(null)
  const catalog = response?.user === user && response.attempt === attempt ? response.variants : undefined
  const is_loading = catalog === undefined
  const page_data = catalog ? get_admin_catalog_page(catalog, query, page) : null
  const total = page_data?.total_variants ?? 0
  const has_products = Boolean(catalog?.length)
  const EmptyIcon = has_products ? SearchXIcon : PackageOpenIcon

  useEffect(() => {
    let active = true
    void get_admin_catalog(user).then((variants) => {
      if (active) set_response({ user, attempt, variants })
    }).catch(() => {
      if (active) set_response({ user, attempt, variants: null })
    })
    return () => { active = false }
  }, [user, attempt])

  /**
   * Actualiza la búsqueda y vuelve a la primera página de coincidencias.
   * @param value Texto escrito por el administrador.
   * @returns No retorna ningún valor.
   */
  function change_query(value: string): void {
    set_query(value)
    set_page(1)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-end gap-2 sm:gap-3 sm:px-5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="admin-catalog-query">Buscar productos</Label>
            <div className="relative">
              <SearchIcon aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-catalog-query"
                type="search"
                value={query}
                onChange={(event) => change_query(event.target.value)}
                placeholder="Nombre, marca, color o SKU"
                autoComplete="off"
                className="h-10 bg-background ps-9"
              />
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 cursor-pointer" disabled={query === ""} onClick={() => change_query("")}>
            <RotateCcwIcon aria-hidden="true" />
            Limpiar
          </Button>
        </CardContent>
      </Card>
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold">Variantes del catálogo</h2>
            <p role="status" className="mt-0.5 text-xs text-muted-foreground">
              {is_loading ? "Consultando productos…" : page_data ? `${total.toLocaleString("es-CR")} ${total === 1 ? "variante encontrada" : "variantes encontradas"}` : ""}
            </p>
          </div>
          {page_data && (
            <AdminPagination label="Páginas de productos" page={page_data.current_page} total_pages={page_data.total_pages} on_page_change={set_page} />
          )}
        </div>
        <div aria-busy={is_loading} className="border-t pt-4 lg:pt-0">
          {is_loading ? (
            <CardContent aria-hidden="true" className="space-y-2 pb-4 lg:pt-4">
              {[1, 2, 3].map((row) => <Skeleton key={row} className="h-16 w-full" />)}
            </CardContent>
          ) : catalog === null ? (
            <CardContent className="pb-4 lg:pt-4">
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>No pudimos consultar los productos</AlertTitle>
                <AlertDescription>
                  Vuelve a intentarlo para consultar ambos canales.
                  <Button type="button" variant="outline" size="sm" className="mt-2 w-fit cursor-pointer" onClick={() => set_attempt((value) => value + 1)}>
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          ) : page_data && total > 0 ? (
            <AdminCatalogTable variants={page_data.variants} />
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center sm:py-12">
              <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                <EmptyIcon aria-hidden="true" className="size-5" />
              </div>
              <h3 className="mt-1 font-semibold">{has_products ? "No hay variantes para esta búsqueda" : "Todavía no hay productos registrados"}</h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                {has_products ? "Prueba otro nombre, marca, color o SKU." : "Las variantes aparecerán aquí al publicarse en el catálogo."}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
