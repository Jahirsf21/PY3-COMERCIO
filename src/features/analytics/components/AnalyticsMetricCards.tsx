import { EyeIcon, SearchIcon, ShoppingBagIcon, ShoppingCartIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalyticsMetrics } from "@/lib/analytics/types"

type MetricCard = {
  title: string
  value: number
  detail: string
  icon: LucideIcon
}

/**
 * Obtiene el texto de una cantidad con su sustantivo en singular o plural.
 * @param count Cantidad.
 * @param singular Sustantivo en singular.
 * @param plural Sustantivo en plural.
 * @returns Cantidad con el sustantivo correspondiente.
 */
function format_count(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString("es-CR")} ${count === 1 ? singular : plural}`
}

/**
 * Tarjetas con las cuatro métricas de Analytics: productos visualizados, búsquedas, agregados al carrito y compras.
 * @param props Propiedades del componente.
 * @param props.metrics Métricas calculadas con get_analytics_metrics().
 * @param props.label Nombre accesible de la lista de tarjetas.
 * @returns Lista de tarjetas en dos columnas en móviles y cuatro en escritorio.
 */
export function AnalyticsMetricCards({ metrics, label }: { metrics: AnalyticsMetrics; label: string }) {
  const cards: MetricCard[] = [
    {
      title: "Productos visualizados",
      value: metrics.product_views,
      detail: format_count(metrics.unique_products_viewed, "producto distinto", "productos distintos"),
      icon: EyeIcon,
    },
    { title: "Búsquedas realizadas", value: metrics.searches, detail: "En el buscador del catálogo", icon: SearchIcon },
    {
      title: "Agregados al carrito",
      value: metrics.add_to_cart,
      detail: format_count(metrics.added_units, "unidad", "unidades"),
      icon: ShoppingCartIcon,
    },
    { title: "Compras realizadas", value: metrics.purchases, detail: "Con pago aprobado", icon: ShoppingBagIcon },
  ]

  return (
    <ul aria-label={label} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map(({ title, value, detail, icon: Icon }) => (
        <li key={title} className="min-w-0">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2 text-sm text-muted-foreground">
                <span className="min-w-0 break-words">{title}</span>
                <Icon aria-hidden="true" className="size-4 shrink-0" />
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-auto space-y-1">
              <p className="text-3xl font-semibold tabular-nums">{value.toLocaleString("es-CR")}</p>
              <CardDescription className="break-words text-xs">{detail}</CardDescription>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
