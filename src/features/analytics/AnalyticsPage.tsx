import { useMemo } from "react"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShopHeader } from "@/components/shop-header"
import { AnalyticsMetricCards } from "@/features/analytics/components/AnalyticsMetricCards"
import { DailyEventsChart } from "@/features/analytics/components/DailyEventsChart"
import { UserTypesChart } from "@/features/analytics/components/UserTypesChart"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { get_analytics_metrics, get_browser_analytics, get_daily_event_counts } from "@/lib/analytics/metrics"
import type { AnalyticsEvent } from "@/lib/analytics/types"
import { useAuth } from "@/lib/auth/authContext"

type AnalyticsSectionProps = {
  id: string
  title: string
  description?: string
  summary?: ReactNode
  events: AnalyticsEvent[]
}

/**
 * Sección con las tarjetas de métricas y el gráfico de eventos por día de un conjunto de eventos.
 * @param props Propiedades de la sección.
 * @param props.id Identificador del título, para el nombre accesible de la sección.
 * @param props.title Título de la sección.
 * @param props.description Texto opcional que indica de quién son los eventos.
 * @param props.summary Contenido opcional que se muestra antes de las tarjetas, como el gráfico de tipos de usuario.
 * @param props.events Eventos que se resumen.
 * @returns Sección de métricas.
 */
function AnalyticsSection({ id, title, description, summary, events }: AnalyticsSectionProps) {
  const metrics = useMemo(() => get_analytics_metrics(events), [events])
  const days = useMemo(() => get_daily_event_counts(events), [events])

  return (
    <section aria-labelledby={id} className="space-y-4">
      <div>
        <h2 id={id} className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {summary}
      <AnalyticsMetricCards metrics={metrics} label={`Métricas: ${title}`} />
      <DailyEventsChart days={days} />
    </section>
  )
}

/**
 * Pantalla de actividad ("Tu actividad" para clientes, "Métricas de uso" para el ADMIN) con las métricas del usuario activo, calculadas con sus eventos registrados.
 * El ADMIN ve además el total de todos los usuarios y sesiones anónimas del navegador.
 * Sin sesión redirige al inicio de sesión, que vuelve a esta pantalla al iniciarla.
 * @returns Pantalla de métricas de uso, o la redirección al inicio de sesión.
 */
export default function AnalyticsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const { owner_id, events, storage_error } = useAnalytics()
  const is_admin = user?.role === "ADMIN"
  const browser_analytics = useMemo(() => (is_admin ? get_browser_analytics(owner_id, events) : null), [is_admin, owner_id, events])

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <div className="min-h-dvh bg-background">
      <ShopHeader sticky />
      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">{is_admin ? "Métricas de uso" : "Tu actividad"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {is_admin
              ? "Resumen de tu actividad y de la de todos los usuarios de la tienda: productos vistos, búsquedas, productos agregados al carrito y compras."
              : "Resumen de tu actividad en la tienda: productos que viste, búsquedas, productos agregados al carrito y compras."}
          </p>
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
          title="Tu actividad en la tienda"
          description="Acciones registradas"
          events={events}
        />
        {browser_analytics && (
          <AnalyticsSection
            id="analytics-browser"
            title="Actividad de los usuarios"
            summary={<UserTypesChart users_count={browser_analytics.users_count} guest_sessions_count={browser_analytics.guest_sessions_count} />}
            events={browser_analytics.events}
          />
        )}
      </main>
    </div>
  )
}
