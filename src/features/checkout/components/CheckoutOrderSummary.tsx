import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { get_cart_review_message } from "@/lib/cart/cart"
import { useCart } from "@/lib/cart/cartContext"
import type { DeliveryMethod } from "@/lib/checkout/types"
import { format_price } from "@/lib/shared/utils"
import { routes } from "@/lib/navigation/routes"

type CheckoutOrderSummaryProps = {
  delivery_method: DeliveryMethod | null
  is_store_ready: boolean
  is_assigning_store: boolean
  is_generating: boolean
}

export function CheckoutOrderSummary({ delivery_method, is_store_ready, is_assigning_store, is_generating }: CheckoutOrderSummaryProps) {
  const { cart, subtotal, shipping: cart_shipping, tax, can_checkout, is_validating, item_validation } = useCart()
  const review_message = cart.length > 0 && !can_checkout && !is_validating ? get_cart_review_message(Object.values(item_validation)) : null
  const currency = cart[0]?.currency ?? "CRC"
  const shipping = delivery_method === "PICKUP" ? 0 : cart_shipping
  const total = subtotal + tax + shipping
  const can_show_amounts = can_checkout && is_store_ready

  return (
    <section aria-labelledby="checkout-order-summary-title" className="min-w-0 rounded-2xl border border-border bg-card p-5">
      <h2 id="checkout-order-summary-title" className="text-lg font-semibold">2. Resumen de la orden</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="break-words font-medium">{can_show_amounts ? format_price(subtotal, currency) : "—"}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Impuestos (13 %)</dt>
          <dd className="break-words font-medium">{can_show_amounts ? format_price(tax, currency) : "—"}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">{delivery_method === "PICKUP" ? "Retiro" : "Envío"}</dt>
          <dd className="break-words font-medium">{!can_show_amounts ? "—" : delivery_method === null ? "Por definir" : delivery_method === "PICKUP" ? "Sin costo" : shipping === 0 ? "Gratis" : format_price(shipping, currency)}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-input pt-4">
          <dt className="text-base font-semibold">Total</dt>
          <dd className="break-words text-lg font-semibold">{can_show_amounts && delivery_method !== null ? format_price(total, currency) : "—"}</dd>
        </div>
      </dl>
      <Button type="submit" form="checkout-form" disabled={!can_checkout || is_assigning_store || is_generating || (delivery_method === "SHIPPING" && !is_store_ready)} size="lg" className="mt-5 h-11 w-full cursor-pointer">
        {is_generating ? "Validando pedido…" : "Generar orden de compra"}
      </Button>
      {review_message && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {review_message}{" "}
          <Link to={routes.cart} className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ir al carrito</Link>
        </p>
      )}
    </section>
  )
}
