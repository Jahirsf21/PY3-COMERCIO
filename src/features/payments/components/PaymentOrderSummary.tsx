import type { OrderDetails } from "@/lib/orders/types"
import { format_price } from "@/lib/shared/utils"

type PaymentOrderSummaryProps = {
  order: OrderDetails
}

export function PaymentOrderSummary({ order }: PaymentOrderSummaryProps) {
  return (
    <section aria-labelledby="payment-order-summary-title" className="min-w-0 rounded-xl border border-input bg-card p-5">
      <h2 id="payment-order-summary-title" className="text-lg font-semibold">Resumen de la compra</h2>
      <p className="mt-2 text-sm text-muted-foreground">{order.delivery_method === "PICKUP" ? "Retiro en" : "Envío desde"} {order.store.locale_name} · {order.store.province}</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="break-words font-medium">{format_price(order.subtotal, order.currency)}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">IVA (13 %)</dt>
          <dd className="break-words font-medium">{format_price(order.tax, order.currency)}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">{order.delivery_method === "PICKUP" ? "Retiro" : "Envío"}</dt>
          <dd className="break-words font-medium">{order.delivery_method === "PICKUP" ? "Sin costo" : order.shipping === 0 ? "Gratis" : format_price(order.shipping, order.currency)}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-input pt-4">
          <dt className="text-base font-semibold">Total</dt>
          <dd className="break-words text-lg font-semibold">{format_price(order.total, order.currency)}</dd>
        </div>
      </dl>
    </section>
  )
}
