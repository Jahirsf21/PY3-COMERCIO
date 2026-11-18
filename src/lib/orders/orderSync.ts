import { parse_orders_data, recover_interrupted_payments } from "@/lib/orders/orders"
import type { LocalOrders, OrderDetails, StoredOrders } from "@/lib/orders/types"
import { get_stored_json, is_record } from "@/lib/shared/utils"

const orders_storage_key = "space-shop-orders:v2"

/**
 * Obtiene los pedidos guardados en el navegador y marca como error los pagos interrumpidos.
 * @returns Pedidos válidos e identificadores pendientes de sincronizar.
 */
export function get_stored_order_state(): StoredOrders {
  const raw = get_stored_json(orders_storage_key)
  const orders = parse_orders_data(is_record(raw) ? raw.orders : raw)
  const pending_ids = new Set(is_record(raw) && Array.isArray(raw.pending_order_ids) ? raw.pending_order_ids : [])
  return {
    orders: recover_interrupted_payments(orders),
    pending_order_ids: orders.filter((order) => pending_ids.has(order.id) || order.payment?.status === "PENDING").map(({ id }) => id),
  }
}

/**
 * Guarda los pedidos y los identificadores pendientes de sincronizar en localStorage.
 * @param state Datos que se desean guardar.
 * @returns true si se guardaron los datos; false si el navegador rechaza la escritura.
 */
export function save_order_state({ orders, pending_order_ids }: StoredOrders): boolean {
  try {
    window.localStorage.setItem(orders_storage_key, JSON.stringify({ orders, pending_order_ids }))
    return true
  } catch {
    return false
  }
}

/**
 * Actualiza los pedidos locales con los de Algolia sin reemplazar los cambios pendientes o más recientes.
 * @param current Estado actual de los pedidos en el navegador.
 * @param previous Estado local antes de consultar Algolia.
 * @param remote_orders Pedidos obtenidos de Algolia.
 * @returns Estado actualizado, o el mismo si no hubo cambios.
 */
export function merge_indexed_orders(current: StoredOrders, previous: StoredOrders, remote_orders: OrderDetails[]): StoredOrders {
  if (!remote_orders.length) return current
  const before = new Map(previous.orders.map((order) => [order.id, order]))
  const merged = new Map(current.orders.map((order) => [order.id, order]))
  const pending = new Set([...previous.pending_order_ids, ...current.pending_order_ids])
  let changed = false
  for (const order of remote_orders) {
    const local = merged.get(order.id)
    if (pending.has(order.id) || local !== before.get(order.id) || local?.payment?.status === "PENDING") continue
    merged.set(order.id, order)
    changed = true
  }
  return changed ? { orders: [...merged.values()], pending_order_ids: current.pending_order_ids } : current
}

/**
 * Quita el pedido de los pendientes si no cambió mientras se guardaba en Algolia.
 * @param state Estado actual de los pedidos en el navegador.
 * @param order Pedido que se guardó en Algolia.
 * @returns Estado actualizado, o el mismo si el pedido cambió.
 */
export function acknowledge_order_sync(state: StoredOrders, order: OrderDetails): StoredOrders {
  if (!state.orders.includes(order)) return state
  return { orders: state.orders, pending_order_ids: state.pending_order_ids.filter((id) => id !== order.id) }
}

/**
 * Guarda los pedidos pendientes en Algolia sin repetir los pagos.
 * @param get_state Función que obtiene el estado actual de los pedidos.
 * @param publish Función que guarda un pedido en Algolia.
 * @param acknowledge Función que confirma que se guardó el pedido.
 * @returns Promesa que termina después de intentar guardar los pedidos pendientes.
 */
export async function sync_pending_orders(
  get_state: () => LocalOrders,
  publish: (order: OrderDetails) => Promise<void>,
  acknowledge: (order: OrderDetails) => void,
): Promise<void> {
  const attempted = new Set<OrderDetails>()
  while (true) {
    const { orders, pending_order_ids, unsaved_order_ids } = get_state()
    const order = orders.find((candidate) => pending_order_ids.includes(candidate.id) &&
      !attempted.has(candidate) && !unsaved_order_ids.includes(candidate.id) && candidate.payment?.status !== "PENDING")
    if (!order) return
    attempted.add(order)
    try {
      await publish(order)
    } catch {
      continue
    }
    acknowledge(order)
  }
}
