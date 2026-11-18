import { algolia_indices, search_client } from "@/lib/algolia/algolia"
import { get_indexed_account_identities } from "@/lib/auth/accountIndex"
import type { User } from "@/lib/auth/types"
import { parse_orders_data } from "@/lib/orders/orders"
import type { AdminOrderDetail, OrderDetails, OrderIndexRecord } from "@/lib/orders/types"
import { get_filter_value, is_non_negative_integer, is_record } from "@/lib/shared/utils"

const max_order_record_bytes = 10_000
const payment_record_reserve = 256

let orders_writer: ReturnType<typeof import("algoliasearch").algoliasearch> | undefined

/**
 * Prepara el pedido para guardarlo en Algolia sin repetir su identificador en cada línea.
 * @param order Pedido que se desea guardar.
 * @returns Datos del pedido listos para guardar en el índice.
 */
export function to_order_index_record(order: OrderDetails): OrderIndexRecord {
  const { id, items, payment, user_id, role, channel, company, order_number, created_at, buyer, store,
    delivery_method, delivery, currency, subtotal, tax, shipping, total, status, termsAcceptance } = order
  return {
    objectID: id,
    user_id, role, channel, company, order_number, created_at,
    created_at_timestamp: Date.parse(created_at),
    buyer, store, delivery_method, delivery, currency, subtotal, tax, shipping, total, status, termsAcceptance,
    items: items.map(({ id, product_id, sku, selected_size, title, image, unit_price, quantity, subtotal, conditions, available_quantity }) => ({
      id, product_id, sku, selected_size, title, image, unit_price, quantity, subtotal, conditions, available_quantity,
    })),
    payment: payment ? {
      id: payment.id,
      created_at: payment.created_at,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    } : null,
  }
}

/**
 * Calcula cuánto ocupa el registro al convertirlo a JSON en UTF-8.
 * @param record Registro que se desea medir.
 * @returns Tamaño del registro en bytes.
 */
function get_record_bytes(record: OrderIndexRecord): number {
  return new TextEncoder().encode(JSON.stringify(record)).length
}

/**
 * Comprueba si el pedido cabe en el índice dejando espacio para el resultado del pago.
 * @param order Pedido que se desea crear.
 * @returns true si el registro respeta el límite de tamaño.
 */
export function can_index_order(order: OrderDetails): boolean {
  return get_record_bytes(to_order_index_record(order)) + payment_record_reserve <= max_order_record_bytes
}

/**
 * Guarda el pedido en Algolia usando su UUID.
 * @param order Pedido que se desea guardar.
 * @returns Promesa que termina cuando el pedido queda disponible en el índice.
 * @throws Si falta la configuración o no se puede guardar el pedido.
 */
export async function save_indexed_order(order: OrderDetails): Promise<void> {
  const indexName = algolia_indices.orders
  const app_id = import.meta.env.VITE_ALGOLIA_APPLICATION_ID
  const write_key = import.meta.env.VITE_ALGOLIA_ORDERS_WRITE_API_KEY
  if (!indexName || !app_id || !write_key) throw new Error("El guardado de pedidos no está configurado.")
  const body = to_order_index_record(order)
  if (get_record_bytes(body) > max_order_record_bytes) throw new Error("El pedido supera el tamaño permitido.")
  if (!orders_writer) {
    const { algoliasearch } = await import("algoliasearch")
    orders_writer = algoliasearch(app_id, write_key)
  }
  const { taskID } = await orders_writer.addOrUpdateObject({ indexName, objectID: body.objectID, body })
  if (!is_non_negative_integer(taskID)) throw new Error("Algolia no confirmó la escritura del pedido.")
  await orders_writer.waitForTask({ indexName, taskID, maxRetries: 10 })
}

/**
 * Obtiene los pedidos del usuario o invitado activo, o todos si es ADMIN.
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @param is_admin Indica si la sesión puede consultar todos los pedidos.
 * @returns Promesa con los pedidos válidos que se obtuvieron de Algolia.
 * @throws Si falla la consulta o la respuesta es inválida.
 */
export async function get_indexed_orders(owner_id: string, is_admin: boolean): Promise<OrderDetails[]> {
  const indexName = algolia_indices.orders
  if (!indexName || (!is_admin && !owner_id)) throw new Error("La consulta de pedidos no está configurada.")
  const filters = is_admin ? undefined : `user_id:${get_filter_value(owner_id)}`
  const records: unknown[] = []
  let page = 0
  let pages: number
  do {
    const { data: { results } } = await search_client.searchWithHTTPInfo<OrderIndexRecord>({
      requests: [{
        indexName, query: "", filters, page, hitsPerPage: 100, distinct: false,
        attributesToHighlight: [], attributesToSnippet: [],
      }],
    })
    const result = results[0]
    if (!result || !("hits" in result) || !Array.isArray(result.hits) || !is_non_negative_integer(result.nbPages)) {
      throw new Error("No pudimos consultar los pedidos.")
    }
    records.push(...result.hits)
    pages = result.nbPages
    page++
  } while (page < pages)

  return parse_indexed_orders(records, is_admin ? undefined : owner_id)
}

/**
 * Restaura el identificador del pedido antes de validar sus datos.
 * @param records Registros sin validar.
 * @param owner_id Propietario que debe coincidir, si corresponde.
 * @returns Pedidos válidos del índice.
 */
function parse_indexed_orders(records: unknown[], owner_id?: string): OrderDetails[] {
  return parse_orders_data(records.flatMap((record) => {
    if (!is_record(record) || typeof record.objectID !== "string" || !Array.isArray(record.items) ||
      (owner_id !== undefined && record.user_id !== owner_id)) return []
    const id = record.objectID
    return [{
      ...record,
      id,
      items: record.items.map((item: unknown) => is_record(item) ? { ...item, order_id: id } : item),
      payment: is_record(record.payment) ? { ...record.payment, order_id: id } : record.payment,
    }]
  }))
}

/**
 * Consulta desde el panel el detalle de una orden registrada por su UUID.
 * @param user Usuario de la sesión simulada; debe ser ADMIN.
 * @param order_id UUID del pedido.
 * @returns Orden validada, o undefined si no está disponible.
 * @throws Si no hay acceso o no se puede consultar el índice.
 */
export async function get_indexed_admin_order(user: User | null, order_id: string): Promise<AdminOrderDetail | undefined> {
  if (user?.role !== "ADMIN") throw new Error("Solo el administrador puede consultar este detalle.")
  if (!order_id) return undefined
  const indexName = algolia_indices.orders
  if (!indexName) throw new Error("La consulta de pedidos no está configurada.")

  const { data: { results: [result] } } = await search_client.searchWithHTTPInfo<OrderIndexRecord>({
    requests: [{
      indexName, query: "", filters: `objectID:${get_filter_value(order_id)}`, hitsPerPage: 1, distinct: false,
      analytics: false, attributesToHighlight: [], attributesToSnippet: [],
    }],
  })
  if (!result || !("hits" in result) || !Array.isArray(result.hits)) throw new Error("No pudimos consultar el pedido.")
  const matching = result.hits.filter((record) => is_record(record) && record.objectID === order_id)
  const order = parse_indexed_orders(matching)[0]
  if (!order) return undefined
  const accounts = await get_indexed_account_identities(user, order.role === "GUEST" ? [] : [order.user_id])
  return { ...order, account: accounts.get(order.user_id) ?? null }
}
