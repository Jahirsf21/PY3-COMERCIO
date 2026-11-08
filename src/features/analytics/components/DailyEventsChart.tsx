import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { AnalyticsEventType, DailyEventCount } from "@/lib/analytics/types"

const event_type_labels: Record<AnalyticsEventType, string> = {
  login: "Inicios de sesión",
  search: "Búsquedas",
  product_view: "Vistas de producto",
  add_to_cart: "Agregados al carrito",
  checkout_start: "Inicios de checkout",
  purchase: "Compras",
}

const event_type_order: AnalyticsEventType[] = ["product_view", "search", "add_to_cart", "checkout_start", "purchase", "login"]

/**
 * Convierte una fecha AAAA-MM-DD en una fecha local, sin desfase por zona horaria.
 * @param date_key Fecha con el formato AAAA-MM-DD.
 * @returns Fecha local a las 00:00.
 */
function parse_date_key(date_key: string): Date {
  const [year, month, day] = date_key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Obtiene la etiqueta corta de un día para el eje del gráfico, por ejemplo "vie 7".
 * @param date_key Fecha con el formato AAAA-MM-DD.
 * @returns Día de la semana abreviado y número del día.
 */
function format_short_day(date_key: string): string {
  const date = parse_date_key(date_key)
  const weekday = date.toLocaleDateString("es-CR", { weekday: "short" }).replace(".", "")
  return `${weekday} ${date.getDate()}`
}

/**
 * Obtiene la fecha completa de un día para el detalle y la tabla, por ejemplo "viernes, 7 de noviembre".
 * @param date_key Fecha con el formato AAAA-MM-DD.
 * @returns Fecha legible.
 */
function format_long_day(date_key: string): string {
  return parse_date_key(date_key).toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" })
}

/**
 * Gráfico de barras con la cantidad de eventos registrados por día en los últimos 7 días, hecho con HTML y Tailwind.
 * Cada barra muestra su total y, al pasar el cursor o enfocarla, el detalle por tipo de evento.
 * Incluye una tabla equivalente para lectores de pantalla.
 * @param props Propiedades del componente.
 * @param props.days Conteos por día obtenidos con get_daily_event_counts(), del más antiguo al más reciente.
 * @returns Tarjeta con el gráfico de eventos por día.
 */
export function DailyEventsChart({ days }: { days: DailyEventCount[] }) {
  const max_total = Math.max(0, ...days.map((day) => day.total))
  const week_total = days.reduce((sum, day) => sum + day.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos por día</CardTitle>
        <CardDescription>
          Últimos 7 días · {week_total.toLocaleString("es-CR")} {week_total === 1 ? "evento" : "eventos"} en total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {week_total === 0 ? (
          <p className="flex h-48 items-center justify-center rounded-lg border border-dashed border-input px-4 text-center text-sm text-muted-foreground">
            Todavía no hay eventos en los últimos 7 días.
          </p>
        ) : (
          <div aria-hidden="true" className="flex h-56 items-stretch gap-1 border-b border-input sm:gap-3">
            {days.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger
                  render={<div />}
                  className="group flex min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-1 rounded-t-md outline-none hover:bg-muted/60"
                >
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">{day.total > 0 ? day.total : ""}</span>
                  <span
                    className="w-full max-w-10 rounded-t-sm bg-primary transition-opacity group-hover:opacity-80"
                    style={{ height: `${max_total > 0 ? (day.total / max_total) * 85 : 0}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent className="flex-col items-start gap-1">
                  <span className="font-semibold first-letter:uppercase">{format_long_day(day.date)}</span>
                  {event_type_order.filter((type) => day.counts[type] > 0).map((type) => (
                    <span key={type} className="flex w-full justify-between gap-4">
                      <span>{event_type_labels[type]}</span>
                      <span className="tabular-nums">{day.counts[type]}</span>
                    </span>
                  ))}
                  {day.total === 0 && <span>Sin eventos</span>}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
        {week_total > 0 && (
          <div aria-hidden="true" className="mt-2 flex gap-1 sm:gap-3">
            {days.map((day) => (
              <span key={day.date} className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground">{format_short_day(day.date)}</span>
            ))}
          </div>
        )}
        <table className="sr-only">
          <caption>Eventos registrados por día en los últimos 7 días</caption>
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">Total</th>
              {event_type_order.map((type) => <th key={type} scope="col">{event_type_labels[type]}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row">{format_long_day(day.date)}</th>
                <td>{day.total}</td>
                {event_type_order.map((type) => <td key={type}>{day.counts[type]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
