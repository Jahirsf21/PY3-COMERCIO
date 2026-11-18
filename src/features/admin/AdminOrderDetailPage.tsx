import { useEffect, useState } from "react"
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { ShopHeader } from "@/components/shop-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AdminOrderAccount } from "@/features/admin/components/AdminOrderAccount"
import { order_customer_labels, order_status_labels, payment_status_labels } from "@/features/admin/orderLabels"
import { OrderCustomerInfo } from "@/features/orders/components/OrderCustomerInfo"
import { OrderProducts } from "@/features/orders/components/OrderProducts"
import { PaymentOrderSummary } from "@/features/payments/components/PaymentOrderSummary"
import type { User } from "@/lib/auth/types"
import { format_order_date } from "@/lib/orders/orders"
import { get_indexed_admin_order } from "@/lib/orders/ordersIndex"
import type { AdminOrderDetail } from "@/lib/orders/types"

/** Respuesta del detalle de una orden. */
type DetailResponse = {
  id: string
  attempt: number
  order: AdminOrderDetail | null | undefined
}

/**
 * Muestra una orden publicada sin ofrecer acciones de compra.
 * @param props Sesión administrativa.
 * @returns Detalle de solo lectura.
 */
export default function AdminOrderDetailPage({ user }: { user: User }) {
  const { orderId = "" } = useParams()
  const [attempt, set_attempt] = useState(0)
  const [response, set_response] = useState<DetailResponse | null>(null)
  const current = response?.id === orderId && response.attempt === attempt ? response : null
  const order = current?.order

  useEffect(() => {
    let active = true
    void get_indexed_admin_order(user, orderId).then((order) => {
      if (active) set_response({ id: orderId, attempt, order })
    }).catch(() => {
      if (active) set_response({ id: orderId, attempt, order: null })
    })
    return () => { active = false }
  }, [user, orderId, attempt])

  return (
    <div className="min-h-dvh bg-muted/35">
      <ShopHeader sticky />
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-7 sm:px-6">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/admin" />}
          className="h-9"
        >
          <ArrowLeftIcon aria-hidden="true" />
          Volver al dashboard
        </Button>
        {current === null ? (
          <p role="status" className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">Buscando la orden…</p>
        ) : order === null ? (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>No pudimos consultar esta orden</AlertTitle>
            <AlertDescription>
              <p>Inténtalo de nuevo.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => set_attempt((value) => value + 1)}>Reintentar</Button>
            </AlertDescription>
          </Alert>
        ) : !order ? (
          <section className="rounded-xl border bg-card p-5">
            <h1 className="text-xl font-semibold">No encontramos esta orden</h1>
            <p className="mt-2 text-sm text-muted-foreground">Verifica el enlace o vuelve al dashboard para consultar las órdenes registradas.</p>
          </section>
        ) : (
          <>
            <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="admin-order-title">
              <h1 id="admin-order-title" className="text-2xl font-semibold tracking-tight wrap-anywhere">Orden {order.order_number}</h1>
              <p className="mt-1 text-sm text-muted-foreground"><time dateTime={order.created_at}>{format_order_date(order.created_at)}</time></p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Cuenta del cliente</dt>
                  <dd className="mt-1"><AdminOrderAccount account={order.account} role={order.role} /></dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Destinatario</dt>
                  <dd className="mt-1 font-medium wrap-anywhere">{order.buyer.full_name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tipo de cliente</dt>
                  <dd className="mt-1 font-medium">{order_customer_labels[order.role]}</dd>
                </div>
                {order.company && (
                  <div>
                    <dt className="text-muted-foreground">Empresa</dt>
                    <dd className="mt-1 font-medium wrap-anywhere">{order.company.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Estado de la orden</dt>
                  <dd className="mt-1 font-medium">{order_status_labels[order.status]}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Estado del pago</dt>
                  <dd className="mt-1 font-medium">{order.payment ? payment_status_labels[order.payment.status] : "Sin intento"}</dd>
                </div>
              </dl>
            </section>
            <OrderProducts key={order.id} order={order} />
            <PaymentOrderSummary order={order} />
            <OrderCustomerInfo order={order} />
          </>
        )}
      </main>
    </div>
  )
}
