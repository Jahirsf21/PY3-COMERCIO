import { useRef, useState } from "react"
import type { ReactNode } from "react"
import type { OrderDetails, OrdersContextValue, PayOrderResult, PreparedOrder } from "@/lib/orders/types"
import type { CardPaymentData, PaymentResult } from "@/lib/payments/types"
import { add_order, cancel_order, complete_order_payment, create_order, create_order_payment, get_next_order_number, get_order_payment_block, get_stored_orders, recover_interrupted_payments, save_orders, start_order_payment } from "@/lib/orders/orders"
import { process_payment, validate_card_payment_data } from "@/lib/payments/payments"
import OrdersContext from "@/lib/orders/ordersContext"

/**
 * Gestiona los pedidos de esta pestaña y conserva en memoria los resultados de pago que no se puedan guardar.
 * Recupera como ERROR las simulaciones interrumpidas, sin repetirlas.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que consumen los pedidos.
 * @returns Proveedor del estado, la persistencia y las acciones de los pedidos.
 */
export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, set_orders] = useState(() => recover_interrupted_payments(get_stored_orders()))
  const current_orders = useRef(orders)
  const [storage_error, set_storage_error] = useState(false)
  const [unsaved_order_ids, set_unsaved_order_ids] = useState<string[]>([])

  /**
   * Guarda la lista de pedidos y actualiza su estado en memoria.
   * Si falla la escritura, solo conserva el cambio cuando corresponde a un resultado final de pago.
   * @param next_orders Pedidos que se desean guardar.
   * @param unsaved_order_id Pedido cuyo resultado debe conservarse en memoria si falla el guardado.
   * @returns true si se guardó en localStorage; false si falló la escritura.
   */
  function commit_orders(next_orders: OrderDetails[], unsaved_order_id?: string): boolean {
    const is_saved = save_orders(next_orders)
    set_storage_error(!is_saved)
    if (!is_saved && !unsaved_order_id) return false
    current_orders.current = next_orders
    set_orders(next_orders)
    set_unsaved_order_ids((ids) => is_saved ? [] : [...new Set([...ids, unsaved_order_id!])])
    return is_saved
  }

  /**
   * Genera identificadores y el siguiente consecutivo para un pedido ya preparado y lo guarda.
   * @param prepared_order Datos verificados del comprador, la tienda, la entrega y los productos.
   * @returns Pedido guardado, o null si no se pudo crear o persistir.
   */
  function generate_order(prepared_order: PreparedOrder): OrderDetails | null {
    const order = create_order(prepared_order, get_next_order_number(current_orders.current))
    if (!order || !commit_orders(add_order(current_orders.current, order))) return null
    return order
  }

  /**
   * Cancela y guarda un pedido pendiente que no tenga un pago en proceso ni un resultado sin guardar.
   * @param order_id Identificador del pedido.
   * @returns true si la cancelación se guardó; false si no se permite o falla la escritura.
   */
  function cancel_pending_order(order_id: string): boolean {
    if (unsaved_order_ids.includes(order_id)) return false
    const next_orders = cancel_order(current_orders.current, order_id)
    return next_orders !== current_orders.current && commit_orders(next_orders)
  }

  /**
   * Registra un intento de pago, consulta el Sandbox y conserva su resultado sin guardar la tarjeta.
   * Bloquea nuevos intentos del mismo pedido en esta pestaña mientras se procesa o falta guardar el resultado.
   * @param order_id Identificador del pedido que se desea pagar.
   * @param card_data Datos de la tarjeta, utilizados únicamente durante este intento.
   * @returns Promesa con el resultado procesado, pendiente de guardar o rechazado antes de completar la operación.
   */
  async function pay_order(order_id: string, card_data: CardPaymentData): Promise<PayOrderResult> {
    if (unsaved_order_ids.includes(order_id)) return { status: "rejected", message: "Guarda el resultado pendiente antes de continuar." }
    if (Object.keys(validate_card_payment_data(card_data)).length > 0) return { status: "rejected", message: "Revisa los datos de la tarjeta." }
    const order = current_orders.current.find((order) => order.id === order_id)
    if (!order) return { status: "rejected", message: "No encontramos la orden." }
    const payment_block = get_order_payment_block(order)
    if (payment_block) return { status: "rejected", message: payment_block }

    const payment = create_order_payment(order)
    if (!commit_orders(start_order_payment(current_orders.current, order_id, payment))) {
      return { status: "rejected", message: "No pudimos registrar el pago. Intenta nuevamente." }
    }
    let result: PaymentResult
    try {
      result = await process_payment(card_data, order)
    } catch {
      result = { status: "ERROR", message: "La pasarela de pago no respondió. Intenta nuevamente." }
    }
    const next_orders = complete_order_payment(current_orders.current, order_id, payment.id, result)
    if (next_orders === current_orders.current) return { status: "rejected", message: "Este intento de pago ya no está vigente." }
    const is_saved = commit_orders(next_orders, order_id)
    return {
      status: is_saved ? "processed" : "unsaved",
      payment: { ...payment, status: result.status },
      message: is_saved ? result.message : "No pudimos guardar el resultado del pago. Al reintentar no se realizará otro pago.",
    }
  }

  const value: OrdersContextValue = {
    orders,
    storage_error,
    unsaved_order_ids,
    /**
     * Busca un pedido en el estado vigente de esta pestaña.
     * @param order_id Identificador del pedido.
     * @returns Pedido encontrado, o undefined si no existe.
     */
    get_order: (order_id) => current_orders.current.find((order) => order.id === order_id),
    create_order: generate_order,
    cancel_order: cancel_pending_order,
    pay_order,
    /**
     * Reintenta guardar el estado actual sin volver a ejecutar los pagos.
     * @returns true si se guardaron los pedidos; false si continúa el error de escritura.
     */
    retry_save_orders: () => commit_orders(current_orders.current),
  }

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}
