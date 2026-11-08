import { ChevronDownIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { AnalyticsEventType, DailyEventCount } from "@/lib/analytics/types"
import { cn } from "@/lib/shared/utils"

/**
 * Tipos de evento en el orden del recorrido de compra, con su etiqueta y su color.
 * Los colores siguen una paleta categórica validada para daltonismo en modo claro y oscuro; el orden es fijo.
 */
const event_series: { type: AnalyticsEventType; label: string; color: string }[] = [
  { type: "product_view", label: "Vistas de producto", color: "bg-[#2a78d6] dark:bg-[#3987e5]" },
  { type: "search", label: "Búsquedas", color: "bg-[#eb6834] dark:bg-[#d95926]" },
  { type: "add_to_cart", label: "Agregados al carrito", color: "bg-[#1baf7a] dark:bg-[#199e70]" },
  { type: "checkout_start", label: "Inicios del proceso de compra", color: "bg-[#eda100] dark:bg-[#c98500]" },
  { type: "purchase", label: "Compras", color: "bg-[#e87ba4] dark:bg-[#d55181]" },
  { type: "login", label: "Inicios de sesión", color: "bg-[#008300] dark:bg-[#008300]" },
]

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
 * Muestra de color de un tipo de evento, para la leyenda y el detalle.
 * @param props Propiedades del componente.
 * @param props.color Clases de color del tipo de evento.
 * @returns Cuadro de color decorativo.
 */
function SeriesSwatch({ color }: { color: string }) {
  return <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-[3px]", color)} />
}

/**
 * Gráfico de barras agrupadas con la cantidad de eventos registrados por día y por tipo en los últimos 7 días,
 * hecho con HTML y Tailwind. Cada tipo de evento tiene su color y aparece en la leyenda.
 * Al pasar el cursor o enfocar un día se muestra su detalle por tipo, y una tabla desplegable muestra los mismos datos.
 * @param props Propiedades del componente.
 * @param props.days Conteos por día obtenidos con get_daily_event_counts(), del más antiguo al más reciente.
 * @returns Tarjeta con el gráfico de eventos por día.
 */
export function DailyEventsChart({ days }: { days: DailyEventCount[] }) {
  const max_count = Math.max(0, ...days.flatMap((day) => event_series.map(({ type }) => day.counts[type])))
  const week_total = days.reduce((sum, day) => sum + day.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad por día</CardTitle>
        <CardDescription>
          Últimos 7 días · {week_total.toLocaleString("es-CR")} {week_total === 1 ? "acción registrada" : "acciones registradas"} en total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {week_total === 0 ? (
          <p className="flex h-48 items-center justify-center rounded-lg border border-dashed border-input px-4 text-center text-sm text-muted-foreground">
            Todavía no hay actividad registrada en los últimos 7 días.
          </p>
        ) : (
          <>
            <ul aria-label="Tipos de acción" className="flex flex-wrap gap-x-4 gap-y-1.5">
              {event_series.map(({ type, label, color }) => (
                <li key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <SeriesSwatch color={color} />
                  {label}
                </li>
              ))}
            </ul>
            <div aria-hidden="true">
              <div className="flex h-56 items-stretch gap-1 border-b border-input sm:gap-3">
                {days.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger
                      render={<div />}
                      className="flex min-w-0 flex-1 cursor-default items-end justify-center gap-0.5 rounded-t-md px-0.5 outline-none hover:bg-muted/60"
                    >
                      {event_series.map(({ type, color }) => (
                        <span
                          key={type}
                          className={cn("w-full max-w-4 rounded-t-sm", color)}
                          style={{ height: `${max_count > 0 ? (day.counts[type] / max_count) * 100 : 0}%` }}
                        />
                      ))}
                    </TooltipTrigger>
                    <TooltipContent className="flex-col items-start gap-1">
                      <span className="font-semibold first-letter:uppercase">{format_long_day(day.date)}</span>
                      {day.total === 0 && <span>Sin actividad registrada</span>}
                      {day.total > 0 && event_series.filter(({ type }) => day.counts[type] > 0).map(({ type, label, color }) => (
                        <span key={type} className="flex w-full items-center gap-1.5">
                          <SeriesSwatch color={color} />
                          <span className="flex-1">{label}</span>
                          <span className="pl-3 tabular-nums">{day.counts[type]}</span>
                        </span>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="mt-2 flex gap-1 sm:gap-3">
                {days.map((day) => (
                  <span key={day.date} className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground">{format_short_day(day.date)}</span>
                ))}
              </div>
            </div>
          </>
        )}
        <Collapsible>
          <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Ver datos en tabla
            <ChevronDownIcon aria-hidden="true" className="size-4 transition-transform group-data-panel-open:rotate-180 motion-reduce:transition-none" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="overflow-x-auto rounded-lg border border-input">
              <table className="w-full min-w-xl text-left text-xs">
                <caption className="sr-only">Acciones registradas por día y por tipo en los últimos 7 días</caption>
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Día</th>
                    {event_series.map(({ type, label }) => <th key={type} scope="col" className="px-3 py-2 text-right font-medium">{label}</th>)}
                    <th scope="col" className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.date} className="border-t border-input">
                      <th scope="row" className="px-3 py-2 font-medium first-letter:uppercase">{format_long_day(day.date)}</th>
                      {event_series.map(({ type }) => <td key={type} className="px-3 py-2 text-right tabular-nums">{day.counts[type]}</td>)}
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{day.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
