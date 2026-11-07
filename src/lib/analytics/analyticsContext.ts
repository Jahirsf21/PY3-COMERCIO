import { createContext, useContext } from "react"
import type { AnalyticsContextValue } from "@/lib/analytics/types"

/**
 * Contexto que comparte los eventos registrados y las acciones de analítica.
 */
const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined)

export default AnalyticsContext

/**
 * Obtiene los eventos registrados y las acciones de analítica.
 * @returns Valor del contexto de analítica.
 * @throws Si se usa fuera de AnalyticsProvider.
 */
export function useAnalytics(): AnalyticsContextValue {
  const analytics_context = useContext(AnalyticsContext)
  if (!analytics_context) {
    throw new Error("useAnalytics debe utilizarse dentro de AnalyticsProvider")
  }
  return analytics_context
}
