import { algolia_indices, search_client } from "@/lib/algolia/algolia"
import { get_indexed_account_identities } from "@/lib/auth/accountIndex"
import type { User } from "@/lib/auth/types"
import type { AdminOrderSearchInput, AdminOrderSearchResult, AdminOrderStats, AdminOrderSummary, OrderCustomer, OrderStatus } from "@/lib/orders/types"
import type { PaymentStatus } from "@/lib/payments/types"
import { get_filter_value, is_non_negative_integer, is_nonempty_string, is_positive_integer, is_record, is_valid_currency, is_valid_date, is_valid_image, is_valid_price } from "@/lib/shared/utils"
import { get_store } from "@/lib/stores/stores"

const order_roles: OrderCustomer["role"][] = ["B2C", "B2B", "GUEST"]
const order_statuses: OrderStatus[] = ["PENDING", "CONFIRMED", "CANCELLED"]
const payment_statuses: PaymentStatus[] = ["PENDING", "APPROVE", "DECLINED", "ERROR"]
const order_summary_attributes = [
  "order_number", "buyer.full_name", "company.name", "created_at", "user_id", "role", "store.id", "total", "currency", "status", "payment.status", "items.image",
]
const order_stats_attributes = ["status", "payment.status", "total", "currency"]
const admin_order_stats_limit = 1000
const admin_orders_page_size = 20
const admin_orders_filter_fallback_limit = 100
const admin_orders_read_error = "No pudimos consultar las órdenes. Intenta nuevamente."

/**
 * Comprueba que un valor coincida con una de las opciones admitidas.
 * @param value Valor recibido en un filtro o registro.
 * @param options Opciones válidas del campo.
 * @returns true si el valor es una de las opciones.
 */
function is_order_option<T extends string>(value: unknown, options: T[]): value is T {
  return options.some((option) => option === value)
}

/**
 * Valida y combina los filtros exactos de la consulta administrativa.
 * @param input Búsqueda con los filtros elegidos.
 * @returns Expresión para Algolia, o undefined si no hay filtros.
 * @throws Si un valor no es una opción válida.
 */
function get_admin_order_filters({ role, store_id, status, payment_status }: AdminOrderSearchInput): string | undefined {
  if ((role !== undefined && !is_order_option(role, order_roles)) ||
    (store_id !== undefined && !get_store(store_id)) ||
    (status !== undefined && !is_order_option(status, order_statuses)) ||
    (payment_status !== undefined && !is_order_option(payment_status, payment_statuses))) {
    throw new Error("Revisa los filtros de órdenes.")
  }

  const filters: string[] = []
  if (role !== undefined) filters.push(`role:${get_filter_value(role)}`)
  if (store_id !== undefined) filters.push(`store.id:${get_filter_value(store_id)}`)
  if (status !== undefined) filters.push(`status:${get_filter_value(status)}`)
  if (payment_status !== undefined) filters.push(`payment.status:${get_filter_value(payment_status)}`)
  return filters.join(" AND ") || undefined
}

/**
 * Valida los campos del índice necesarios para presentar una fila.
 * @param hit Datos sin validar de un pedido, sin sus líneas ni datos de contacto.
 * @returns Resumen válido, o null si el registro no se puede mostrar.
 */
function parse_admin_order_summary(hit: unknown): AdminOrderSummary | null {
  if (!is_record(hit)) return null
  const { objectID, order_number, created_at, user_id, buyer, role, company, store, total, currency, status, payment, items } = hit
  const order_store = is_record(store) && is_nonempty_string(store.id) ? get_store(store.id) : null
  if (!is_nonempty_string(objectID) || !is_nonempty_string(order_number) || !is_valid_date(created_at) || !is_nonempty_string(user_id) ||
    !is_record(buyer) || !is_nonempty_string(buyer.full_name) || !is_order_option(role, order_roles) ||
    !order_store || !is_valid_price(total) || !is_valid_currency(currency) || !is_order_option(status, order_statuses)) {
    return null
  }

  const company_name = is_record(company) && is_nonempty_string(company.name) ? company.name.trim() : null
  if (role === "B2B" && company_name === null) return null
  if (payment != null && !is_record(payment)) return null
  const payment_status = is_record(payment) ? payment.status ?? null : null
  if (payment_status !== null && !is_order_option(payment_status, payment_statuses)) return null
  const order_items = Array.isArray(items) ? items : []
  const first_image = is_record(order_items[0]) && is_valid_image(order_items[0].image) ? order_items[0].image : null

  return {
    id: objectID,
    order_number,
    created_at,
    user_id,
    account: null,
    recipient_name: buyer.full_name.trim(),
    role,
    company_name: role === "B2B" ? company_name : null,
    store: { ...order_store },
    total,
    currency,
    status,
    payment_status,
    first_item_image: first_image ? { url: first_image.url.trim(), alt: first_image.alt } : null,
    items_count: order_items.length,
  }
}

/**
 * Solicita una página de resúmenes a Algolia.
 * @param index_name Índice de órdenes.
 * @param query Texto de búsqueda.
 * @param page Página, comenzando en 1.
 * @param page_size Cantidad de registros solicitados.
 * @param filters Filtros exactos opcionales.
 * @returns Página con los resúmenes válidos.
 * @throws Si falla la consulta o la respuesta es inválida.
 */
async function read_order_summary_page(index_name: string, query: string, page: number, page_size: number, filters?: string): Promise<AdminOrderSearchResult> {
  const response = await search_client.searchWithHTTPInfo({
    requests: [{
      indexName: index_name,
      query,
      filters,
      page: page - 1,
      hitsPerPage: page_size,
      distinct: false,
      attributesToRetrieve: order_summary_attributes,
    }],
  }).catch(() => { throw new Error(admin_orders_read_error) })

  const result: unknown = response?.data?.results?.[0]
  if (!is_record(result) || !Array.isArray(result.hits) ||
    !is_non_negative_integer(result.nbPages) || !is_non_negative_integer(result.nbHits)) {
    throw new Error(admin_orders_read_error)
  }

  const orders = result.hits.flatMap((hit) => {
    const order = parse_admin_order_summary(hit)
    return order ? [order] : []
  })
  return { orders, current_page: page, total_pages: result.nbPages, total_orders: result.nbHits }
}

/**
 * Busca órdenes para ADMIN sin cargar ni modificar la copia local.
 * Si las facetas no devuelven coincidencias, comprueba los filtros sobre una sola página acotada.
 * @param user Usuario de la sesión simulada.
 * @param input Texto, filtros y página solicitada, comenzando en 1.
 * @returns Página de hasta 20 órdenes en el orden del índice.
 * @throws Si no hay acceso, la consulta falla o los filtros son inválidos.
 */
export async function search_admin_orders(user: User | null, input: AdminOrderSearchInput = {}): Promise<AdminOrderSearchResult> {
  if (user?.role !== "ADMIN") throw new Error("Solo el administrador puede consultar todas las órdenes.")
  const index_name = algolia_indices.orders
  if (!index_name) throw new Error("La consulta administrativa de órdenes no está configurada.")

  const query = input.query?.trim() ?? ""
  const page = is_positive_integer(input.page) ? input.page : 1
  const filters = get_admin_order_filters(input)
  let result = await read_order_summary_page(index_name, query, page, admin_orders_page_size, filters)
  if (filters && result.total_orders === 0) {
    // Algolia devuelve cero coincidencias si todavía no están configuradas las facetas.
    const candidates = await read_order_summary_page(index_name, query, 1, admin_orders_filter_fallback_limit)
    if (candidates.total_pages <= 1 && candidates.total_orders <= admin_orders_filter_fallback_limit) {
      const matching_orders = candidates.orders.filter((order) =>
        (input.role === undefined || order.role === input.role) &&
        (input.store_id === undefined || order.store.id === input.store_id) &&
        (input.status === undefined || order.status === input.status) &&
        (input.payment_status === undefined || order.payment_status === input.payment_status),
      )
      const start = (page - 1) * admin_orders_page_size
      result = {
        orders: matching_orders.slice(start, start + admin_orders_page_size),
        current_page: page,
        total_pages: Math.ceil(matching_orders.length / admin_orders_page_size),
        total_orders: matching_orders.length,
      }
    }
  }

  const account_ids = result.orders.filter((order) => order.role !== "GUEST").map((order) => order.user_id)
  const accounts = await get_indexed_account_identities(user, account_ids)
  return {
    ...result,
    orders: result.orders.map((order) => ({
      ...order,
      account: order.role === "GUEST" ? null : accounts.get(order.user_id) ?? null,
    })),
  }
}

/**
 * Calcula el resumen de órdenes del panel: total, pagadas, pendientes y monto pagado por moneda.
 * @param user Usuario de la sesión simulada.
 * @returns Conteos y montos; is_partial indica que hay más órdenes que las leídas.
 * @throws Si no hay acceso o la consulta falla.
 */
export async function get_admin_order_stats(user: User | null): Promise<AdminOrderStats> {
  if (user?.role !== "ADMIN") throw new Error("Solo el administrador puede consultar todas las órdenes.")
  const index_name = algolia_indices.orders
  if (!index_name) throw new Error("La consulta administrativa de órdenes no está configurada.")

  const response = await search_client.searchWithHTTPInfo({
    requests: [{
      indexName: index_name,
      hitsPerPage: admin_order_stats_limit,
      distinct: false,
      attributesToRetrieve: order_stats_attributes,
    }],
  }).catch(() => { throw new Error(admin_orders_read_error) })

  const result: unknown = response?.data?.results?.[0]
  if (!is_record(result) || !Array.isArray(result.hits) || !is_non_negative_integer(result.nbHits)) throw new Error(admin_orders_read_error)

  const paid_totals = new Map<string, number>()
  let paid_orders = 0
  let pending_orders = 0
  for (const hit of result.hits) {
    if (!is_record(hit)) continue
    if (hit.status === "PENDING") pending_orders += 1
    const payment_status = is_record(hit.payment) ? hit.payment.status : null
    if (payment_status === "APPROVE" && is_valid_price(hit.total) && is_valid_currency(hit.currency)) {
      paid_orders += 1
      paid_totals.set(hit.currency, (paid_totals.get(hit.currency) ?? 0) + hit.total)
    }
  }
  return {
    total_orders: result.nbHits,
    paid_orders,
    pending_orders,
    paid_totals: [...paid_totals].map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 })),
    is_partial: result.nbHits > result.hits.length,
  }
}
