import type { AnalyticsEvent, AnalyticsEventPayloads, AnalyticsEventType } from "@/lib/analytics/types"
import { is_valid_role } from "@/lib/auth/auth"
import { get_stored_json, get_user_storage_key, is_nonempty_string, is_positive_integer, is_record, is_valid_currency, is_valid_price, save_stored_list } from "@/lib/shared/utils"

const analytics_event_types: AnalyticsEventType[] = ["login", "search", "product_view", "add_to_cart", "checkout_start", "purchase"]
const max_stored_events = 500

/**
 * Obtiene el identificador de la sesión anónima del navegador, o crea uno nuevo si no existe.
 * Si el navegador no permite guardarlo, el identificador nuevo se usa solo en memoria.
 * @returns Identificador con el formato guest-<uuid>.
 */
export function get_guest_session_id(): string {
  try {
    const stored_id = window.localStorage.getItem("space-shop-guest-session")
    if (stored_id && /^guest-[0-9a-f-]{36}$/.test(stored_id)) return stored_id
  } catch {
    return `guest-${window.crypto.randomUUID()}`
  }
  const guest_id = `guest-${window.crypto.randomUUID()}`
  try {
    window.localStorage.setItem("space-shop-guest-session", guest_id)
  } catch {
    return guest_id
  }
  return guest_id
}

/**
 * Normaliza el texto de una búsqueda quitando los espacios externos y repetidos.
 * @param query Texto ingresado en el buscador.
 * @returns Búsqueda normalizada, o null si tiene menos de 2 caracteres.
 */
export function normalize_search_query(query: string): string | null {
  const normalized_query = query.trim().replace(/\s+/g, " ")
  return normalized_query.length >= 2 ? normalized_query : null
}

/**
 * Comprueba que un valor sea un arreglo de textos no vacíos.
 * @param value Valor que se desea comprobar.
 * @returns true si todos los elementos son textos con contenido.
 */
function is_string_list(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(is_nonempty_string)
}

/**
 * Valida la información de un evento según su tipo.
 * @param type Tipo del evento.
 * @param payload Información recibida.
 * @returns true si la información tiene los campos esperados para el tipo.
 */
function is_valid_payload(type: AnalyticsEventType, payload: Record<string, unknown>): boolean {
  if (type === "login") return is_nonempty_string(payload.user_id) && is_valid_role(payload.role)
  if (type === "search") return is_nonempty_string(payload.query)
  if (type === "product_view") {
    return is_nonempty_string(payload.product_id) && is_nonempty_string(payload.sku) && is_nonempty_string(payload.title) && is_string_list(payload.categories)
  }
  if (type === "add_to_cart") {
    return is_nonempty_string(payload.product_id) && is_nonempty_string(payload.sku) && is_nonempty_string(payload.title) &&
      is_nonempty_string(payload.selected_size) && is_positive_integer(payload.quantity) && is_valid_price(payload.unit_price) && is_valid_currency(payload.currency)
  }
  if (type === "checkout_start") {
    return is_positive_integer(payload.items_count) && is_positive_integer(payload.total_units) && is_valid_price(payload.total) && is_valid_currency(payload.currency)
  }
  return is_nonempty_string(payload.order_id) && is_positive_integer(payload.order_number) && is_positive_integer(payload.items_count) &&
    is_valid_price(payload.total) && is_valid_currency(payload.currency)
}

/**
 * Valida los eventos guardados y descarta los que tengan datos incorrectos.
 * @param events_data Contenido guardado en localStorage.
 * @returns Eventos válidos en el orden en que se registraron, como máximo los 500 más recientes.
 */
export function parse_analytics_events(events_data: unknown): AnalyticsEvent[] {
  if (!Array.isArray(events_data)) return []
  const events = events_data.filter((event): event is AnalyticsEvent => {
    if (!is_record(event) || !is_nonempty_string(event.id) || !analytics_event_types.includes(event.type as AnalyticsEventType)) return false
    if (typeof event.occurred_at !== "string" || Number.isNaN(Date.parse(event.occurred_at))) return false
    return is_record(event.payload) && is_valid_payload(event.type as AnalyticsEventType, event.payload)
  })
  return events.slice(-max_stored_events)
}

/**
 * Obtiene los eventos de un usuario o sesión anónima guardados en localStorage y los valida mediante parse_analytics_events().
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @returns Eventos válidos, o un arreglo vacío si no se pueden recuperar.
 */
export function get_stored_events(owner_id: string): AnalyticsEvent[] {
  return parse_analytics_events(get_stored_json(get_user_storage_key("space-shop-events", owner_id)))
}

/**
 * Guarda los eventos de un usuario o sesión anónima en localStorage.
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @param events Eventos que se desean guardar.
 * @returns true si se guardaron; false si el navegador rechaza la operación.
 */
export function save_events(owner_id: string, events: AnalyticsEvent[]): boolean {
  return save_stored_list(get_user_storage_key("space-shop-events", owner_id), events)
}

/**
 * Crea un evento con un identificador único y la fecha y hora actuales.
 * @param type Tipo del evento.
 * @param payload Información de la acción.
 * @returns Evento listo para registrar.
 */
export function create_analytics_event<T extends AnalyticsEventType>(type: T, payload: AnalyticsEventPayloads[T]): AnalyticsEvent {
  return { id: window.crypto.randomUUID(), type, occurred_at: new Date().toISOString(), payload } as AnalyticsEvent
}

/**
 * Agrega un evento al final de la lista y conserva solo los 500 más recientes.
 * @param events Eventos registrados.
 * @param event Evento nuevo.
 * @returns Lista nueva con el evento agregado.
 */
export function add_analytics_event(events: AnalyticsEvent[], event: AnalyticsEvent): AnalyticsEvent[] {
  return [...events, event].slice(-max_stored_events)
}

/**
 * Registra un evento directamente en localStorage para un usuario o sesión anónima.
 * Se usa cuando el evento ocurre fuera de AnalyticsProvider, como el inicio de sesión.
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @param type Tipo del evento.
 * @param payload Información de la acción.
 * @returns true si se guardó; false si el navegador rechaza la operación.
 */
export function record_analytics_event<T extends AnalyticsEventType>(owner_id: string, type: T, payload: AnalyticsEventPayloads[T]): boolean {
  return save_events(owner_id, add_analytics_event(get_stored_events(owner_id), create_analytics_event(type, payload)))
}
