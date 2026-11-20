import { Link } from "react-router-dom"
import { ClipboardListIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { ShopHeader } from "@/components/shop-header"
import { OrdersNotice } from "@/features/orders/components/OrdersNotice"
import { OrderThumbnail } from "@/features/orders/components/OrderThumbnail"
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge"
import { format_order_date } from "@/lib/orders/orders"
import { useOrders } from "@/lib/orders/ordersContext"
import { cn, format_price } from "@/lib/shared/utils"
import { order_path } from "@/lib/navigation/routes"

/**
 * Muestra los pedidos accesibles del más reciente al más antiguo.
 * Permite consultar sus detalles aunque el carrito esté vacío.
 * @returns Listado de pedidos o estado vacío si todavía no se han generado compras.
 */
export default function OrdersPage() {
  const { orders, orders_read_status, storage_error, unsaved_order_ids } = useOrders()

  return (
    <div className="min-h-dvh bg-background">
      <ShopHeader sticky />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Mi cuenta</p>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Mis pedidos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Consulta el estado de tus compras.</p>
        </div>
        <OrdersNotice />
        {orders.length === 0 ? (
          orders_read_status === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">Consultando tus pedidos…</p>
          ) : orders_read_status === "ready" && !storage_error && (
            <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <ClipboardListIcon aria-hidden="true" className="mb-4 size-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Todavía no tienes pedidos</h2>
              <Link to="/" className={buttonVariants({ size: "lg", className: "mt-6 cursor-pointer" })}>
                Ir al catálogo
              </Link>
            </section>
          )
        ) : (
          <ul aria-label="Pedidos generados" className="space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <article aria-labelledby={`order-${order.id}-title`} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-x-5">
                  <OrderThumbnail image={order.items[0]?.image ?? null} items_count={order.items.length} />
                  <div className="grid min-w-0 gap-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 id={`order-${order.id}-title`} className="min-w-0 text-lg leading-tight font-semibold wrap-anywhere">Pedido #{order.order_number}</h2>
                      <OrderStatusBadge order={order} has_unsaved_result={unsaved_order_ids.includes(order.id)} />
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Fecha</dt>
                        <dd className="text-sm font-medium wrap-anywhere"><time dateTime={order.created_at}>{format_order_date(order.created_at)}</time></dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Moneda</dt>
                        <dd className="text-sm font-medium">{order.currency}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Total</dt>
                        <dd className="font-semibold wrap-anywhere">{format_price(order.total, order.currency)}</dd>
                      </div>
                    </dl>
                  </div>
                  <Link
                    to={order_path(order.id)}
                    className={cn(buttonVariants({ variant: "outline" }), "col-span-full min-h-10 cursor-pointer border-input sm:justify-self-end md:col-span-1 md:min-h-0")}
                    aria-label={`Ver pedido #${order.order_number}`}
                  >
                    Ver pedido
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
