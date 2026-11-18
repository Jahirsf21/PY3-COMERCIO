import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { CreateOrderResult, LocalOrders, OrderDetails, OrdersContextValue, OrdersReadStatus, PayOrderResult, PreparedOrder, StoredOrders } from "@/lib/orders/types"
import type { CardPaymentData, PaymentResult } from "@/lib/payments/types"
import { add_order, cancel_order, complete_order_payment, create_order, create_order_payment, get_order_payment_block, start_order_payment } from "@/lib/orders/orders"
import { acknowledge_order_sync, get_stored_order_state, merge_indexed_orders, save_order_state, sync_pending_orders } from "@/lib/orders/orderSync"
import { can_index_order, get_indexed_orders, save_indexed_order } from "@/lib/orders/ordersIndex"
import { process_payment, validate_card_payment_data } from "@/lib/payments/payments"
import OrdersContext from "@/lib/orders/ordersContext"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { useAuth } from "@/lib/auth/authContext"
import { record_analytics_event } from "@/lib/analytics/analytics"

/**
 * Gestiona los pedidos del usuario o la sesión anónima y permite al ADMIN consultarlos todos.
 * Conserva en memoria los resultados de pago que no se puedan guardar.
 * Recupera como ERROR las simulaciones interrumpidas, sin repetirlas.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que consumen los pedidos.
 * @returns Proveedor del estado, la persistencia y las acciones de los pedidos.
 */
export function OrdersProvider({ children }: { children: ReactNode }) {
  const [local_orders, set_local_orders] = useState<LocalOrders>(() => ({ ...get_stored_order_state(), unsaved_order_ids: [] }))
  const current_orders = useRef(local_orders)
  const sync_running = useRef(false)
  const [storage_error, set_storage_error] = useState(false)
  const [read_revision, set_read_revision] = useState(0)
  const [read_result, set_read_result] = useState<{ key: string; status: OrdersReadStatus } | null>(null)
  const { owner_id, track_event } = useAnalytics()
  const { user } = useAuth()
  const is_admin = user?.role === "ADMIN"
  const read_key = JSON.stringify([owner_id, is_admin, read_revision])
  const current_session = useRef({ owner_id, is_admin, user })
  useLayoutEffect(() => { current_session.current = { owner_id, is_admin, user } }, [owner_id, is_admin, user])
  const visible_orders = local_orders.orders
    .filter((order) => is_admin || order.user_id === owner_id)
    .sort((first, second) => Date.parse(second.created_at) - Date.parse(first.created_at))
  const { unsaved_order_ids, pending_order_ids } = local_orders

  /**
   * Guarda los pedidos en el navegador y, si corresponde, conserva los cambios en memoria.
   * @param next_state Pedidos y cambios pendientes de sincronizar.
   * @param options Indica qué conservar en memoria si no se pueden guardar los datos.
   * @returns true si se guardaron los pedidos; false si el navegador rechaza la escritura.
   */
  const commit_order_state = useCallback((next_state: StoredOrders, options?: { keep_on_error?: boolean; unsaved_order_id?: string }): boolean => {
    const saved = save_order_state(next_state)
    set_storage_error(!saved)
    if (!saved && !options?.keep_on_error) return false
    const pending_results = current_orders.current.unsaved_order_ids
    const unsaved = options?.unsaved_order_id ? [...new Set([...pending_results, options.unsaved_order_id])] : pending_results
    const next_local = { ...next_state, unsaved_order_ids: saved ? [] : unsaved }
    current_orders.current = next_local
    set_local_orders(next_local)
    return saved
  }, [])

  /**
   * Sincroniza los pedidos pendientes de uno en uno.
   * @returns Promesa que termina después de intentar guardar los pedidos pendientes.
   */
  const flush_orders = useCallback(async (): Promise<void> => {
    if (sync_running.current) return
    sync_running.current = true
    try {
      await sync_pending_orders(() => current_orders.current, save_indexed_order, (order) => {
        const current = current_orders.current
        const next = acknowledge_order_sync(current, order)
        if (next !== current) commit_order_state(next, { keep_on_error: true })
      })
    } finally {
      sync_running.current = false
    }
  }, [commit_order_state])

  /**
   * Reintenta guardar y sincronizar los pedidos sin repetir los pagos.
   * @returns true si se guardaron los pedidos en el navegador; false si continúa el error.
   */
  const retry_save_orders = useCallback((): boolean => {
    const saved = commit_order_state(current_orders.current)
    if (saved) void flush_orders()
    return saved
  }, [commit_order_state, flush_orders])

  /**
   * Vuelve a consultar los pedidos en Algolia y reintenta guardar los cambios pendientes.
   * @returns No retorna ningún valor.
   */
  const retry_order_sync = useCallback((): void => {
    if (current_orders.current.pending_order_ids.length > 0) retry_save_orders()
    set_read_revision((revision) => revision + 1)
  }, [retry_save_orders])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active && current_orders.current.pending_order_ids.length > 0) retry_save_orders()
    })
    window.addEventListener("online", retry_order_sync)
    return () => {
      active = false
      window.removeEventListener("online", retry_order_sync)
    }
  }, [retry_order_sync, retry_save_orders])

  useEffect(() => {
    let active = true
    const previous = current_orders.current
    get_indexed_orders(owner_id, is_admin).then((remote_orders) => {
      if (!active || current_session.current.owner_id !== owner_id || current_session.current.is_admin !== is_admin) return
      const current = current_orders.current
      const next = merge_indexed_orders(current, previous, remote_orders)
      if (next !== current) {
        const saved = commit_order_state(next, { keep_on_error: true })
        if (saved && current.unsaved_order_ids.length > 0) void flush_orders()
      }
      set_read_result({ key: read_key, status: "ready" })
    }).catch(() => {
      if (active && current_session.current.owner_id === owner_id && current_session.current.is_admin === is_admin) {
        set_read_result({ key: read_key, status: "error" })
      }
    })
    return () => { active = false }
  }, [owner_id, is_admin, read_key, commit_order_state, flush_orders])

  /**
   * Recupera únicamente pedidos del usuario o invitado activo, o cualquier pedido para ADMIN.
   * @param order_id Identificador del pedido.
   * @param active_session Dueño y permiso de consulta que se deben comprobar; por defecto, los del render actual.
   * @returns Pedido propio, cualquier pedido para ADMIN o undefined si no hay acceso.
   */
  function get_accessible_order(order_id: string, active_session = { owner_id, is_admin }): OrderDetails | undefined {
    return current_orders.current.orders.find((order) => order.id === order_id && (active_session.is_admin || order.user_id === active_session.owner_id))
  }

  /**
   * Guarda los cambios en el navegador y los deja pendientes de sincronizar si corresponde.
   * @param next_orders Pedidos que se desean guardar.
   * @param sync_order_id Identificador del pedido que se debe guardar en Algolia.
   * @param keep_result Indica si se conserva el resultado del pago cuando falla el guardado local.
   * @returns true si se guardó el cambio en el navegador; false si falló la escritura.
   */
  function commit_orders(next_orders: OrderDetails[], sync_order_id?: string, keep_result = false): boolean {
    const pending_ids = current_orders.current.pending_order_ids
    const next_pending = sync_order_id && !pending_ids.includes(sync_order_id) ? [...pending_ids, sync_order_id] : pending_ids
    const saved = commit_order_state({ orders: next_orders, pending_order_ids: next_pending }, {
      keep_on_error: keep_result,
      unsaved_order_id: keep_result ? sync_order_id : undefined,
    })
    if (saved && next_pending.length > 0) void flush_orders()
    return saved
  }

  /**
   * Genera y guarda un pedido del usuario o invitado activo si respeta el límite de tamaño.
   * @param prepared_order Datos verificados del comprador, la tienda, la entrega y los productos.
   * @returns Pedido guardado, o un mensaje si no se pudo crear.
   */
  function generate_order(prepared_order: PreparedOrder): CreateOrderResult {
    const active_session = current_session.current
    if (active_session.is_admin || active_session.owner_id !== owner_id || active_session.user !== user) {
      return { status: "rejected", message: "La sesión cambió. Revisa tu carrito e inténtalo nuevamente." }
    }
    const order = create_order(prepared_order, active_session.owner_id, active_session.user)
    if (!order) return { status: "rejected", message: "Revisa los datos de tu pedido e inténtalo nuevamente." }
    if (!can_index_order(order)) {
      return { status: "rejected", message: "Tu pedido excede el tamaño permitido. Divide los productos en pedidos más pequeños." }
    }
    if (!commit_orders(add_order(current_orders.current.orders, order), order.id)) {
      return { status: "rejected", message: "Revisa los permisos de almacenamiento del navegador e intenta nuevamente." }
    }
    return { status: "created", order }
  }

  /**
   * Cancela y guarda un pedido pendiente que no tenga un pago en proceso ni un resultado sin guardar.
   * @param order_id Identificador del pedido.
   * @returns true si la cancelación se guardó; false si no se permite o falla la escritura.
   */
  function cancel_pending_order(order_id: string): boolean {
    if (current_session.current.is_admin || !get_accessible_order(order_id, current_session.current)) return false
    const current = current_orders.current
    if (current.unsaved_order_ids.includes(order_id)) return false
    const next_orders = cancel_order(current.orders, order_id)
    return next_orders !== current.orders && commit_orders(next_orders, order_id)
  }

  /**
   * Registra un intento de pago, consulta el Sandbox y conserva su resultado sin guardar la tarjeta.
   * Bloquea nuevos intentos del mismo pedido en esta pestaña mientras se procesa o falta guardar el resultado.
   * Registra el evento de compra completada cuando el pago es aprobado.
   * @param order_id Identificador del pedido que se desea pagar.
   * @param card_data Datos de la tarjeta, utilizados únicamente durante este intento.
   * @returns Promesa con el resultado procesado, pendiente de guardar o rechazado antes de completar la operación.
   */
  async function pay_order(order_id: string, card_data: CardPaymentData): Promise<PayOrderResult> {
    const payment_session = current_session.current
    const order = get_accessible_order(order_id, payment_session)
    if (payment_session.is_admin || !order) return { status: "rejected", message: "No encontramos la orden." }
    if (current_orders.current.unsaved_order_ids.includes(order_id)) return { status: "rejected", message: "Guarda el resultado pendiente antes de continuar." }
    if (Object.keys(validate_card_payment_data(card_data)).length > 0) return { status: "rejected", message: "Revisa los datos de la tarjeta." }
    const payment_block = get_order_payment_block(order)
    if (payment_block) return { status: "rejected", message: payment_block }

    const payment = create_order_payment(order)
    if (!commit_orders(start_order_payment(current_orders.current.orders, order_id, payment))) {
      return { status: "rejected", message: "No pudimos registrar el pago. Intenta nuevamente." }
    }
    let result: PaymentResult
    try {
      result = await process_payment(card_data, order)
    } catch {
      result = { status: "ERROR", message: "La pasarela de pago no respondió. Intenta nuevamente." }
    }
    const current = current_orders.current.orders
    const next_orders = complete_order_payment(current, order_id, payment.id, result)
    if (next_orders === current) return { status: "rejected", message: "Este intento de pago ya no está vigente." }
    const is_saved = commit_orders(next_orders, order_id, true)
    if (result.status === "APPROVE") {
      const payload = {
        order_id: order.id,
        order_number: order.order_number,
        items_count: order.items.length,
        total: order.total,
        currency: order.currency,
      }
      if (current_session.current.owner_id === payment_session.owner_id) track_event("purchase", payload)
      else record_analytics_event(payment_session.owner_id, "purchase", payload)
    }
    return {
      status: is_saved ? "processed" : "unsaved",
      payment: { ...payment, status: result.status },
      message: is_saved ? result.message : "No pudimos guardar el resultado del pago. Al reintentar no se realizará otro pago.",
    }
  }

  const value: OrdersContextValue = {
    orders: visible_orders,
    storage_error,
    orders_read_status: read_result?.key === read_key ? read_result.status : "loading",
    has_pending_order_sync: visible_orders.some((order) => pending_order_ids.includes(order.id)),
    unsaved_order_ids: unsaved_order_ids.filter((id) => visible_orders.some((order) => order.id === id)),
    /**
     * Busca un pedido en el estado vigente de esta pestaña.
     * @param order_id Identificador del pedido.
     * @returns Pedido encontrado, o undefined si no existe.
     */
    get_order: get_accessible_order,
    create_order: generate_order,
    cancel_order: cancel_pending_order,
    pay_order,
    retry_save_orders,
    retry_order_sync,
  }

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}
