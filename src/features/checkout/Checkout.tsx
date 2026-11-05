import { startTransition, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ShopHeader } from "@/components/shop-header"
import { toast } from "@/components/ui/toast"
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm"
import { CheckoutOrderProducts } from "@/features/checkout/components/CheckoutOrderProducts"
import { CheckoutOrderSummary } from "@/features/checkout/components/CheckoutOrderSummary"
import { clear_stored_checkout_form_data, get_stored_checkout_form_data, save_checkout_form_data } from "@/lib/checkout/checkout"
import type { CheckoutFormData } from "@/lib/checkout/types"
import { useCart } from "@/lib/cart/cartContext"
import { useOrders } from "@/lib/orders/ordersContext"
import { prepare_order } from "@/lib/orders/orders"
import { format_price } from "@/lib/shared/utils"
import { get_best_cart_store } from "@/lib/stores/stores"
import { useStores } from "@/lib/stores/storesContext"
import type { StoreCartProduct } from "@/lib/stores/types"

export default function Checkout() {
  const [formData, setFormData] = useState(get_stored_checkout_form_data)
  const { cart, get_cart, clear_cart, revalidate_cart } = useCart()
  const { create_order } = useOrders()
  const { selected_store, get_selected_store, select_store } = useStores()
  const [is_generating, set_is_generating] = useState(false)
  const creating_order = useRef(false)
  const navigate = useNavigate()
  const [store_retry, set_store_retry] = useState(0)
  const [store_failure, set_store_failure] = useState<{ key: string; message: string } | null>(null)
  const products_key = JSON.stringify(cart.map(({ product_id, sku, selected_size }) => ({ product_id, sku, selected_size })))
  const store_request_key = `${products_key}:${store_retry}`
  const needs_store = formData.delivery_method === "SHIPPING" && selected_store === null && cart.length > 0
  const store_error = needs_store && store_failure?.key === store_request_key ? store_failure.message : undefined
  const is_assigning_store = needs_store && store_error === undefined

  useEffect(() => { save_checkout_form_data(formData) }, [formData])
  useEffect(() => () => { creating_order.current = false }, [])

  useEffect(() => {
    if (!needs_store || store_error !== undefined) return
    let active = true
    const products: StoreCartProduct[] = JSON.parse(products_key)
    get_best_cart_store(products)
      .then((store) => {
        if (!active || get_selected_store() !== null) return
        if (store) select_store(store.id)
        else set_store_failure({ key: store_request_key, message: "No pudimos elegir una tienda para este pedido. Intenta nuevamente." })
      })
      .catch(() => {
        if (active && get_selected_store() === null) {
          set_store_failure({ key: store_request_key, message: "No pudimos consultar el stock para elegir la tienda. Reintenta o selecciona una en el encabezado." })
        }
      })
    return () => { active = false }
  }, [needs_store, store_error, products_key, store_request_key, get_selected_store, select_store])

  /**
   * Prepara y guarda un pedido únicamente si el carrito y la tienda siguen vigentes.
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
    try {
      const prepared = await prepare_order({ ...form_data, cart: order_cart, store })
      if (!creating_order.current) return
      if (get_cart() !== order_cart || get_selected_store() !== store) {
        toast.add({ title: "Revisa tu pedido", description: "El carrito o la tienda cambiaron. Revisa el resumen antes de generar el pedido.", type: "error" })
        return
      }
      if (prepared.status !== "ready") {
        if (prepared.status === "review") revalidate_cart()
        toast.add({ title: "Revisa tu pedido", description: prepared.message, type: "error" })
        return
      }
      const order = create_order(prepared.order)
      if (!order) {
        toast.add({ title: "No pudimos guardar el pedido", description: "Revisa los permisos de almacenamiento del navegador e intenta nuevamente.", type: "error" })
        return
      }
      clear_stored_checkout_form_data()
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
            storeAssignmentError={store_error} onRetryStore={() => set_store_retry((retry) => retry + 1)} />
          <CheckoutOrderProducts />
          <CheckoutOrderSummary delivery_method={formData.delivery_method} is_store_ready={selected_store !== null}
            is_assigning_store={is_assigning_store} is_generating={is_generating} />
        </div>
      </main>
    </div>
  )
}
