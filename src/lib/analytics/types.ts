import type { UserRole } from "@/lib/auth/types"

/**
 * Tipos de eventos de interacción que se registran
 */
export type AnalyticsEventType = "login" | "search" | "product_view" | "add_to_cart" | "checkout_start" | "purchase"

/**
 * Información registrada por cada tipo de evento
 */
export type AnalyticsEventPayloads = {
  login: {
    user_id: string
    role: UserRole
  }
  search: {
    query: string
  }
  product_view: {
    product_id: string
    sku: string
    title: string
    categories: string[]
  }
  add_to_cart: {
    product_id: string
    sku: string
    title: string
    selected_size: string
    quantity: number
    unit_price: number
    currency: string
  }
  checkout_start: {
    items_count: number
    total_units: number
    total: number
    currency: string
  }
  purchase: {
    order_id: string
    order_number: number
    items_count: number
    total: number
    currency: string
  }
}

/**
 * Evento registrado con su tipo, fecha y hora e información de la acción
 */
export type AnalyticsEvent = {
  [T in AnalyticsEventType]: {
    id: string
    type: T
    occurred_at: string
    payload: AnalyticsEventPayloads[T]
  }
}[AnalyticsEventType]

/**
 * Estado y operaciones expuestas por el contexto de analítica
 */
export type AnalyticsContextValue = {
  owner_id: string
  events: AnalyticsEvent[]
  storage_error: boolean
  track_event: <T extends AnalyticsEventType>(type: T, payload: AnalyticsEventPayloads[T]) => void
  track_search: (query: string) => void
}
