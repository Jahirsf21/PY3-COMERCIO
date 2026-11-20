import { useEffect, useState } from "react"
import { PackageOpenIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminOrderFilters } from "@/features/admin/components/AdminOrderFilters"
import { AdminOrderStatsCards } from "@/features/admin/components/AdminOrderStatsCards"
import { AdminOrdersTable } from "@/features/admin/components/AdminOrdersTable"
import { AdminPagination } from "@/features/admin/components/AdminPagination"
import type { User } from "@/lib/auth/types"
import { search_admin_orders } from "@/lib/orders/adminOrders"
import type { AdminOrderSearchInput, AdminOrderSearchResult } from "@/lib/orders/types"

/** Consulta vigente en el panel. */
type OrdersRequest = { filters: AdminOrderSearchInput; page: number }

/** Respuesta asociada a una consulta. */
type OrdersResponse = { request: OrdersRequest; data: AdminOrderSearchResult | null }

/**
 * Permite consultar las órdenes registradas sin modificar el historial del cliente.
 * @param props Sesión ADMIN autorizada por la ruta.
 * @returns Panel administrativo de órdenes.
 */
export function AdminOrdersPanel({ user }: { user: User }) {
  const [request, set_request] = useState<OrdersRequest>({ filters: {}, page: 1 })
  const [response, set_response] = useState<OrdersResponse | null>(null)
  const { filters, page } = request
  const result = response?.request === request ? response.data : undefined
  const is_loading = result === undefined
  const total_pages = response?.request.filters === filters ? response.data?.total_pages ?? 0 : 0
  const has_filters = Boolean(filters.query || filters.role || filters.store_id || filters.status || filters.payment_status)

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      void search_admin_orders(user, { ...filters, page }).then((data) => {
        if (!active) return
        const last_page = Math.max(1, data.total_pages)
        if (page > last_page) {
          set_request((current) => current === request ? { ...current, page: last_page } : current)
          return
        }
        set_response({ request, data })
      }).catch(() => {
        if (active) set_response({ request, data: null })
      })
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [user, request, filters, page])

  const count = result?.total_orders ?? 0
  const empty_index = !has_filters && count === 0
  const EmptyIcon = empty_index ? PackageOpenIcon : SearchXIcon

  return (
    <div className="space-y-4">
      <AdminOrderStatsCards user={user} />
      <AdminOrderFilters
        filters={filters}
        has_filters={has_filters}
        on_change={(patch) => set_request((current) => ({ filters: { ...current.filters, ...patch }, page: 1 }))}
        on_clear={() => set_request({ filters: {}, page: 1 })}
      />
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold">Órdenes registradas</h2>
            <p role="status" className="mt-0.5 text-xs text-muted-foreground">
              {is_loading ? "Consultando órdenes…" : result ? `${count.toLocaleString("es-CR")} ${count === 1 ? "orden encontrada" : "órdenes encontradas"}` : ""}
            </p>
          </div>
          <AdminPagination label="Páginas de órdenes" page={page} total_pages={total_pages} is_loading={is_loading}
            on_page_change={(page) => set_request({ filters, page })} />
        </div>
        <div aria-busy={is_loading} className="border-t pt-4 lg:pt-0">
          {is_loading ? (
            <CardContent aria-hidden="true" className="space-y-2 pb-4 lg:pt-4">
              {[1, 2, 3].map((row) => <Skeleton key={row} className="h-12 w-full" />)}
            </CardContent>
          ) : result === null ? (
            <CardContent className="pb-4 lg:pt-4">
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>No pudimos consultar las órdenes</AlertTitle>
                <AlertDescription>
                  Revisa tu conexión e inténtalo de nuevo.
                  <Button type="button" variant="outline" size="sm" className="mt-2 w-fit cursor-pointer"
                    onClick={() => set_request((current) => ({ ...current }))}>
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          ) : result.orders.length > 0 ? (
            <AdminOrdersTable orders={result.orders} />
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center sm:py-12">
              <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                <EmptyIcon aria-hidden="true" className="size-5" />
              </div>
              <h3 className="mt-1 font-semibold">{empty_index ? "Todavía no hay órdenes registradas" : "No hay órdenes para mostrar"}</h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                {empty_index ? "Las órdenes aparecerán aquí al guardarse." : has_filters ? "Prueba otro término de búsqueda o quita algún filtro." : "No se pudieron mostrar los resultados de esta página."}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
