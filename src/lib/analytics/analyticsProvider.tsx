import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { AnalyticsContextValue, AnalyticsEvent, AnalyticsEventPayloads, AnalyticsEventType, RecentSearch, ViewedProduct } from "@/lib/analytics/types"
import { add_analytics_event, create_analytics_event, get_guest_session_id, get_stored_events, normalize_search_query, save_events } from "@/lib/analytics/analytics"
import { add_recent_search, add_viewed_product, get_stored_recent_searches, get_stored_viewed_products, save_recent_searches, save_viewed_products } from "@/lib/analytics/history"
import AnalyticsContext from "@/lib/analytics/analyticsContext"
import { useAuth } from "@/lib/auth/authContext"

type AnalyticsState = {
  owner_id: string
  events: AnalyticsEvent[]
  viewed_products: ViewedProduct[]
  recent_searches: RecentSearch[]
}

/**
 * Carga los eventos y el historial guardados de un usuario o sesión anónima.
 * @param owner_id Identificador del usuario o de la sesión anónima.
 * @returns Estado de analítica del dueño.
 */
function get_stored_analytics_state(owner_id: string): AnalyticsState {
  return {
    owner_id,
    events: get_stored_events(owner_id),
    viewed_products: get_stored_viewed_products(owner_id),
    recent_searches: get_stored_recent_searches(owner_id),
  }
}

/**
 * Registra los eventos del usuario activo, o de la sesión anónima si no hay sesión, y los guarda en localStorage.
 * A partir de las vistas de producto y las búsquedas mantiene el historial de productos vistos y búsquedas recientes.
 * Al cambiar de usuario carga los eventos y el historial del nuevo dueño y descarta la búsqueda pendiente del anterior.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que registran eventos.
 * @returns Proveedor de los eventos, el historial y las acciones para registrarlos.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [guest_id] = useState(get_guest_session_id)
  const owner_id = user?.id ?? guest_id
  const [analytics_state, set_analytics_state] = useState(() => get_stored_analytics_state(owner_id))
  const [storage_error, set_storage_error] = useState(false)
  const current_state = useRef(analytics_state)
  const search_timer = useRef<number | undefined>(undefined)
  const last_search = useRef<string | null>(null)

  if (analytics_state.owner_id !== owner_id) {
    set_analytics_state(get_stored_analytics_state(owner_id))
    set_storage_error(false)
  }

  useLayoutEffect(() => {
    current_state.current = analytics_state
  }, [analytics_state])

  useEffect(() => {
    last_search.current = null
    return () => window.clearTimeout(search_timer.current)
  }, [owner_id])

  /**
   * Registra un evento para el dueño vigente y lo guarda en localStorage.
   * Una vista de producto actualiza los productos vistos y una búsqueda actualiza las búsquedas recientes.
   * @param type Tipo del evento.
   * @param payload Información de la acción.
   * @returns No retorna ningún valor.
   */
  const track_event = useCallback(<T extends AnalyticsEventType>(type: T, payload: AnalyticsEventPayloads[T]): void => {
    const state = current_state.current
    const event = create_analytics_event(type, payload)
    const next_state: AnalyticsState = { ...state, events: add_analytics_event(state.events, event) }
    let is_saved = save_events(state.owner_id, next_state.events)
    if (event.type === "product_view") {
      const { product_id, sku, title, categories } = event.payload
      next_state.viewed_products = add_viewed_product(state.viewed_products, { product_id, sku, title, categories, viewed_at: event.occurred_at })
      is_saved = save_viewed_products(state.owner_id, next_state.viewed_products) && is_saved
    }
    if (event.type === "search") {
      next_state.recent_searches = add_recent_search(state.recent_searches, { query: event.payload.query, searched_at: event.occurred_at })
      is_saved = save_recent_searches(state.owner_id, next_state.recent_searches) && is_saved
    }
    current_state.current = next_state
    set_analytics_state(next_state)
    set_storage_error(!is_saved)
  }, [])

  /**
   * Registra una búsqueda cuando la persona deja de escribir durante 800 ms.
   * Ignora las búsquedas de menos de 2 caracteres y la misma búsqueda registrada justo antes.
   * @param query Texto actual del buscador.
   * @returns No retorna ningún valor.
   */
  const track_search = useCallback((query: string): void => {
    window.clearTimeout(search_timer.current)
    search_timer.current = window.setTimeout(() => {
      const normalized_query = normalize_search_query(query)
      if (!normalized_query || normalized_query.toLocaleLowerCase("es") === last_search.current) return
      last_search.current = normalized_query.toLocaleLowerCase("es")
      track_event("search", { query: normalized_query })
    }, 800)
  }, [track_event])

  const value: AnalyticsContextValue = {
    owner_id: analytics_state.owner_id,
    events: analytics_state.events,
    viewed_products: analytics_state.viewed_products,
    recent_searches: analytics_state.recent_searches,
    storage_error,
    track_event,
    track_search,
  }

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}
