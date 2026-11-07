import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { AnalyticsContextValue, AnalyticsEventPayloads, AnalyticsEventType } from "@/lib/analytics/types"
import { add_analytics_event, create_analytics_event, get_guest_session_id, get_stored_events, normalize_search_query, save_events } from "@/lib/analytics/analytics"
import AnalyticsContext from "@/lib/analytics/analyticsContext"
import { useAuth } from "@/lib/auth/authContext"

/**
 * Registra los eventos del usuario activo, o de la sesión anónima si no hay sesión, y los guarda en localStorage.
 * Al cambiar de usuario carga los eventos del nuevo dueño y descarta la búsqueda pendiente del anterior.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que registran eventos.
 * @returns Proveedor de los eventos y de las acciones para registrarlos.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [guest_id] = useState(get_guest_session_id)
  const owner_id = user?.id ?? guest_id
  const [events_state, set_events_state] = useState(() => ({ owner_id, events: get_stored_events(owner_id) }))
  const [storage_error, set_storage_error] = useState(false)
  const current_events = useRef(events_state)
  const search_timer = useRef<number | undefined>(undefined)
  const last_search = useRef<string | null>(null)

  if (events_state.owner_id !== owner_id) {
    set_events_state({ owner_id, events: get_stored_events(owner_id) })
    set_storage_error(false)
  }

  useLayoutEffect(() => {
    current_events.current = events_state
  }, [events_state])

  useEffect(() => {
    last_search.current = null
    return () => window.clearTimeout(search_timer.current)
  }, [owner_id])

  /**
   * Registra un evento para el dueño vigente y lo guarda en localStorage.
   * @param type Tipo del evento.
   * @param payload Información de la acción.
   * @returns No retorna ningún valor.
   */
  const track_event = useCallback(<T extends AnalyticsEventType>(type: T, payload: AnalyticsEventPayloads[T]): void => {
    const { owner_id: event_owner_id, events } = current_events.current
    const next_state = { owner_id: event_owner_id, events: add_analytics_event(events, create_analytics_event(type, payload)) }
    current_events.current = next_state
    set_events_state(next_state)
    set_storage_error(!save_events(event_owner_id, next_state.events))
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
    owner_id: events_state.owner_id,
    events: events_state.events,
    storage_error,
    track_event,
    track_search,
  }

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}
