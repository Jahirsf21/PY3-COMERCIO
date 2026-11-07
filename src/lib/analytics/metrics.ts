import { analytics_event_types, get_stored_events } from "@/lib/analytics/analytics"
import type { AnalyticsEvent, AnalyticsEventType, AnalyticsMetrics, BrowserAnalytics, DailyEventCount } from "@/lib/analytics/types"

const events_storage_prefix = "space-shop-events:"

/**
 * Calcula las métricas de Analytics a partir de los eventos registrados.
 * @param events Eventos de un usuario, de una sesión anónima o de todo el navegador.
 * @returns Productos visualizados (vistas y productos distintos), búsquedas, agregados al carrito (veces y unidades) y compras completadas.
 */
export function get_analytics_metrics(events: AnalyticsEvent[]): AnalyticsMetrics {
  const metrics: AnalyticsMetrics = { product_views: 0, unique_products_viewed: 0, searches: 0, add_to_cart: 0, added_units: 0, purchases: 0 }
  const viewed_product_ids = new Set<string>()
  for (const event of events) {
    if (event.type === "product_view") {
      metrics.product_views += 1
      viewed_product_ids.add(event.payload.product_id)
    } else if (event.type === "search") {
      metrics.searches += 1
    } else if (event.type === "add_to_cart") {
      metrics.add_to_cart += 1
      metrics.added_units += event.payload.quantity
    } else if (event.type === "purchase") {
      metrics.purchases += 1
    }
  }
  metrics.unique_products_viewed = viewed_product_ids.size
  return metrics
}

/**
 * Obtiene la fecha local de un momento con el formato AAAA-MM-DD.
 * @param date Momento que se desea convertir.
 * @returns Fecha local sin la hora.
 */
function get_local_date_key(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Crea un conteo vacío con todos los tipos de evento en cero.
 * @returns Conteo por tipo de evento.
 */
function create_empty_counts(): Record<AnalyticsEventType, number> {
  return Object.fromEntries(analytics_event_types.map((type) => [type, 0])) as Record<AnalyticsEventType, number>
}

/**
 * Cuenta los eventos por día, en la fecha local del navegador, para los últimos días hasta hoy.
 * Los días sin eventos se incluyen con conteos en cero; los eventos anteriores o futuros se ignoran.
 * @param events Eventos que se desean contar.
 * @param days_count Cantidad de días, incluido hoy. Por defecto, 7.
 * @param today Fecha que se toma como hoy. Por defecto, la fecha actual.
 * @returns Conteos del día más antiguo al más reciente.
 */
export function get_daily_event_counts(events: AnalyticsEvent[], days_count = 7, today = new Date()): DailyEventCount[] {
  const days: DailyEventCount[] = []
  for (let offset = days_count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    days.push({ date: get_local_date_key(date), counts: create_empty_counts(), total: 0 })
  }
  const days_by_date = new Map(days.map((day) => [day.date, day]))
  for (const event of events) {
    const day = days_by_date.get(get_local_date_key(new Date(event.occurred_at)))
    if (!day) continue
    day.counts[event.type] += 1
    day.total += 1
  }
  return days
}

/**
 * Obtiene los identificadores de los usuarios y sesiones anónimas que tienen eventos guardados en el navegador.
 * @returns Identificadores sin repetir, o un arreglo vacío si no se puede leer localStorage.
 */
export function get_stored_event_owner_ids(): string[] {
  try {
    const owner_ids: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storage_key = window.localStorage.key(index)
      if (!storage_key?.startsWith(events_storage_prefix)) continue
      const owner_id = storage_key.slice(events_storage_prefix.length)
      if (owner_id) owner_ids.push(owner_id)
    }
    return [...new Set(owner_ids)]
  } catch {
    return []
  }
}

/**
 * Reúne los eventos de todos los usuarios y sesiones anónimas del navegador, para el total que ve el ADMIN.
 * Para el dueño vigente usa los eventos en memoria, que incluyen los que no se pudieron guardar.
 * @param current_owner_id Identificador del usuario o la sesión anónima activa.
 * @param current_events Eventos en memoria del dueño vigente.
 * @returns Eventos ordenados por fecha, junto con la cantidad de usuarios y de sesiones anónimas que tienen eventos.
 */
export function get_browser_analytics(current_owner_id: string, current_events: AnalyticsEvent[]): BrowserAnalytics {
  const owner_ids = new Set(get_stored_event_owner_ids())
  owner_ids.delete(current_owner_id)
  const events = [...current_events]
  let users_count = current_events.length > 0 && !current_owner_id.startsWith("guest-") ? 1 : 0
  let guest_sessions_count = current_events.length > 0 && current_owner_id.startsWith("guest-") ? 1 : 0
  for (const owner_id of owner_ids) {
    const owner_events = get_stored_events(owner_id)
    if (owner_events.length === 0) continue
    events.push(...owner_events)
    if (owner_id.startsWith("guest-")) guest_sessions_count += 1
    else users_count += 1
  }
  events.sort((first, second) => Date.parse(first.occurred_at) - Date.parse(second.occurred_at))
  return { events, users_count, guest_sessions_count }
}
