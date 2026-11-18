import { startTransition, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ShopHeader } from "@/components/shop-header"
import { toast } from "@/components/ui/toast"
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm"
import { CheckoutOrderProducts } from "@/features/checkout/components/CheckoutOrderProducts"
import { CheckoutOrderSummary } from "@/features/checkout/components/CheckoutOrderSummary"
import { clear_stored_checkout_form_data, get_stored_checkout_form_data, save_checkout_form_data } from "@/lib/checkout/checkout"
import type { CheckoutFormData } from "@/lib/checkout/types"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { useCart } from "@/lib/cart/cartContext"
import { useOrders } from "@/lib/orders/ordersContext"
import { prepare_order } from "@/lib/orders/orders"
import { format_price } from "@/lib/shared/utils"
import { get_cart_store_availability, select_best_cart_store } from "@/lib/stores/stores"
import { useChannel } from "@/lib/channel/channelContext"
import { useStores } from "@/lib/stores/storesContext"
import type { StoreCartAvailability, StoreCartProduct } from "@/lib/stores/types"

export default function Checkout() {
  const { owner_id: user_id, track_event } = useAnalytics()
  const [formData, setFormData] = useState(() => get_stored_checkout_form_data(user_id))
  const { cart, get_cart, clear_cart, revalidate_cart, total, total_items } = useCart()
  const tracked_checkout = useRef(false)
  const { create_order } = useOrders()
  const { selected_store, get_selected_store, select_store } = useStores()
  const { channel, get_channel } = useChannel()
  const [is_generating, set_is_generating] = useState(false)
  const creating_order = useRef(false)
  const navigate = useNavigate()
  const [store_retry, set_store_retry] = useState(0)
  const [availability, set_availability] = useState<{ key: string; stores: StoreCartAvailability[] } | null>(null)
  const products_key = JSON.stringify(cart.map(({ id, product_id, sku, selected_size, quantity }): StoreCartProduct => ({ id, product_id, sku, selected_size, quantity })))
  const availability_key = `${products_key}:${channel}:${store_retry}`
  const current_availability = availability?.key === availability_key ? availability.stores : null
  const is_checking_availability = cart.length > 0 && current_availability === null
  const suggested_store = current_availability ? select_best_cart_store(current_availability) : null
  const needs_store = formData.delivery_method === "SHIPPING" && selected_store === null && cart.length > 0
  const store_error = needs_store && current_availability !== null && suggested_store === null
    ? "No pudimos comprobar el stock para sugerir una tienda. Reintenta o elige una de la lista."
    : undefined
  const is_assigning_store = needs_store && current_availability === null

  useEffect(() => { save_checkout_form_data(user_id, formData) }, [user_id, formData])
  useEffect(() => () => { creating_order.current = false }, [])
  useEffect(() => {
    if (tracked_checkout.current || cart.length === 0) return
    tracked_checkout.current = true
    track_event("checkout_start", { items_count: cart.length, total_units: total_items, total, currency: cart[0].currency })
  }, [cart, total, total_items, track_event])

  useEffect(() => {
    const products: StoreCartProduct[] = JSON.parse(products_key)
    if (products.length === 0) return
    let active = true
    get_cart_store_availability(products, channel)
      .then((stores) => { if (active) set_availability({ key: availability_key, stores }) })
      .catch(() => { if (active) set_availability({ key: availability_key, stores: [] }) })
    return () => { active = false }
  }, [products_key, channel, availability_key])

  useEffect(() => {
    if (needs_store && suggested_store && get_selected_store() === null) select_store(suggested_store.id)
  }, [needs_store, suggested_store, get_selected_store, select_store])

  /**
   * Prepara y guarda un pedido únicamente si el carrito, la tienda y el canal siguen vigentes.
   * Al guardar, limpia el borrador y el carrito y abre el pago; ante errores conserva los datos.
   * @param form_data Formulario validado con el nombre del comprador resuelto.
   * @returns Promesa que termina al generar el pedido, descartar la solicitud o mostrar el error.
   */
  async function generate_order(form_data: CheckoutFormData): Promise<void> {
    if (creating_order.current) return
    creating_order.current = true
    set_is_generating(true)
    const order_cart = get_cart()
    const store = get_selected_store()
    const order_channel = get_channel()
    try {
      const prepared = await prepare_order({ ...form_data, cart: order_cart, channel: order_channel, store })
      if (!creating_order.current) return
      if (get_cart() !== order_cart || get_selected_store() !== store || get_channel() !== order_channel) {
        toast.add({ title: "Revisa tu pedido", description: "El carrito o la tienda cambiaron. Revisa el resumen antes de generar el pedido.", type: "error" })
        return
      }
      if (prepared.status !== "ready") {
        if (prepared.status === "review") revalidate_cart()
        toast.add({ title: "Revisa tu pedido", description: prepared.message, type: "error" })
        return
      }
      const result = create_order(prepared.order)
      if (result.status === "rejected") {
        toast.add({ title: "No pudimos guardar el pedido", description: result.message, type: "error" })
        return
      }
      const { order } = result
      clear_stored_checkout_form_data(user_id)
      startTransition(() => {
        clear_cart()
        navigate(`/pedido/${encodeURIComponent(order.id)}/pago`, { replace: true })
      })
      toast.add({ title: `Orden #${order.order_number} generada`, description: `Total: ${format_price(order.total, order.currency)}`, type: "success" })
    } catch {
      toast.add({ title: "No pudimos generar el pedido", description: "Tus datos y productos se conservan para reintentar.", type: "error" })
    } finally {
      if (creating_order.current) {
        creating_order.current = false
        set_is_generating(false)
      }
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ShopHeader sticky />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6">
        <h1 className="text-2xl font-semibold">Datos y resumen de la orden de compra</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Completa tus datos y revisa los productos de tu pedido.
        </p>
        <div className="mt-6 space-y-6">
          <CheckoutForm formData={formData} onChange={setFormData} onSubmit={generate_order}
            isGeneratingOrder={is_generating} isAssigningStore={is_assigning_store}
            storeAvailability={current_availability ?? availability?.stores ?? null} isCheckingAvailability={is_checking_availability}
            suggestedStoreId={suggested_store?.id ?? null}
            storeAssignmentError={store_error} onRetryStore={() => set_store_retry((retry) => retry + 1)} />
          <CheckoutOrderProducts />
          <CheckoutOrderSummary delivery_method={formData.delivery_method} is_store_ready={selected_store !== null}
            is_assigning_store={is_assigning_store} is_generating={is_generating} />
        </div>
      </main>
    </div>
  )
}
