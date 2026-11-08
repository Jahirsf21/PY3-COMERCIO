import { useMemo } from "react"
import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ShopHeader } from "@/components/shop-header"
import { AnalyticsMetricCards } from "@/features/analytics/components/AnalyticsMetricCards"
import { DailyEventsChart } from "@/features/analytics/components/DailyEventsChart"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { get_analytics_metrics, get_browser_analytics, get_daily_event_counts } from "@/lib/analytics/metrics"
import type { AnalyticsEvent } from "@/lib/analytics/types"
import { useAuth } from "@/lib/auth/authContext"

type AnalyticsSectionProps = {
  id: string
  title: string
  description: string
  events: AnalyticsEvent[]
}

/**
 * Sección con las tarjetas de métricas y el gráfico de eventos por día de un conjunto de eventos.
 * @param props Propiedades de la sección.
 * @param props.id Identificador del título, para el nombre accesible de la sección.
 * @param props.title Título de la sección.
 * @param props.description Texto que indica de quién son los eventos.
 * @param props.events Eventos que se resumen.
 * @returns Sección de métricas.
 */
function AnalyticsSection({ id, title, description, events }: AnalyticsSectionProps) {
  const metrics = useMemo(() => get_analytics_metrics(events), [events])
  const days = useMemo(() => get_daily_event_counts(events), [events])

  return (
    <section aria-labelledby={id} className="space-y-4">
      <div>
        <h2 id={id} className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <AnalyticsMetricCards metrics={metrics} label={`Métricas: ${title}`} />
      <DailyEventsChart days={days} />
    </section>
  )
}

/**
 * Pantalla de Analytics con las métricas del usuario activo o de la sesión anónima, calculadas con sus eventos registrados.
 * El ADMIN ve además el total de todos los usuarios y sesiones anónimas del navegador.
 * @returns Pantalla de Analytics.
 */
export default function AnalyticsPage() {
  const { user } = useAuth()
  const { owner_id, events, storage_error } = useAnalytics()
  const is_admin = user?.role === "ADMIN"
  const browser_analytics = useMemo(() => (is_admin ? get_browser_analytics(owner_id, events) : null), [is_admin, owner_id, events])

  return (
    <div className="min-h-dvh bg-background">
      <ShopHeader sticky />
      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 lg:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">Analytics</h1>
            {is_admin && <Badge variant="outline">ADMIN</Badge>}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Resumen de la actividad registrada en este navegador.</p>
        </div>
        {storage_error && (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>No pudimos guardar tu actividad reciente</AlertTitle>
            <AlertDescription>Las métricas incluyen tu actividad de esta visita, pero podría perderse al recargar. Revisa los permisos de almacenamiento de tu navegador.</AlertDescription>
          </Alert>
        )}
        <AnalyticsSection
          id="analytics-own"
          title={user ? "Mi actividad" : "Actividad de esta sesión"}
          description={user ? `Eventos de ${user.full_name}.` : "Eventos de la sesión anónima. Inicia sesión para ver la actividad de tu cuenta."}
          events={events}
        />
        {browser_analytics && (
          <AnalyticsSection
            id="analytics-browser"
            title="Total del navegador"
            description={`Eventos de ${browser_analytics.users_count} ${browser_analytics.users_count === 1 ? "usuario" : "usuarios"} y ${browser_analytics.guest_sessions_count} ${browser_analytics.guest_sessions_count === 1 ? "sesión anónima" : "sesiones anónimas"}.`}
            events={browser_analytics.events}
          />
        )}
      </main>
    </div>
  )
}
