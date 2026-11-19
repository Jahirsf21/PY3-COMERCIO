import { useEffect, useState } from "react"
import { RotateCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { User } from "@/lib/auth/types"
import { get_admin_order_stats } from "@/lib/orders/adminOrders"
import type { AdminOrderStats } from "@/lib/orders/types"
import { format_price } from "@/lib/shared/utils"

/** Resultado de una consulta del resumen: datos, o null si falló. */
type StatsResponse = { attempt: number; stats: AdminOrderStats | null }

/**
 * Tarjetas con el total de órdenes, las pagadas, las pendientes y el monto pagado.
 * @param props Sesión ADMIN.
 * @returns Resumen de órdenes de la tienda.
 */
export function AdminOrderStatsCards({ user }: { user: User }) {
  const [attempt, set_attempt] = useState(0)
  const [response, set_response] = useState<StatsResponse | null>(null)
  const current = response?.attempt === attempt ? response : null

  useEffect(() => {
    let active = true
    get_admin_order_stats(user)
      .then((stats) => { if (active) set_response({ attempt, stats }) })
      .catch(() => { if (active) set_response({ attempt, stats: null }) })
    return () => { active = false }
  }, [user, attempt])

  if (current?.stats === null) {
    return (
      <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        No pudimos calcular el resumen de órdenes.
        <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => set_attempt((value) => value + 1)}>
          <RotateCwIcon aria-hidden="true" />
          Reintentar
        </Button>
      </div>
    )
  }

  const stats = current?.stats
  const paid_total = stats
    ? stats.paid_totals.length === 0 ? format_price(0, "CRC") : stats.paid_totals.map(({ amount, currency }) => format_price(amount, currency)).join(" · ")
    : ""
  const items = [
    { label: "Órdenes", value: stats?.total_orders.toLocaleString("es-CR") },
    { label: "Pagadas", value: stats?.paid_orders.toLocaleString("es-CR") },
    { label: "Pendientes", value: stats?.pending_orders.toLocaleString("es-CR") },
    { label: "Total pagado", value: paid_total },
  ]

  return (
    <section aria-label="Resumen de órdenes" aria-busy={!stats} className="space-y-2">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(({ label, value }) => (
          <Card key={label} size="sm" className="gap-1 px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums wrap-anywhere">
              {stats ? value : <Skeleton className="mt-1 h-7 w-20" />}
            </dd>
          </Card>
        ))}
      </dl>
      {stats?.is_partial && (
        <p className="text-xs text-muted-foreground">Resumen calculado con las primeras 1 000 órdenes.</p>
      )}
    </section>
  )
}
