import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/shared/utils"

type UserTypesChartProps = {
  users_count: number
  guest_sessions_count: number
}

/**
 * Gráfico de barra horizontal con la cantidad de usuarios registrados y no registrados que tienen actividad en el navegador,
 * hecho con HTML y Tailwind. Usa los mismos colores validados del gráfico de actividad por día.
 * La barra es decorativa; las cantidades se leen en la leyenda.
 * @param props Propiedades del componente.
 * @param props.users_count Cantidad de usuarios con sesión que tienen actividad.
 * @param props.guest_sessions_count Cantidad de sesiones anónimas con actividad; cada una cuenta como un usuario no registrado.
 * @returns Tarjeta con el gráfico de tipos de usuario.
 */
export function UserTypesChart({ users_count, guest_sessions_count }: UserTypesChartProps) {
  const total = users_count + guest_sessions_count
  const series = [
    { label: "Usuarios registrados", value: users_count, color: "bg-[#2a78d6] dark:bg-[#3987e5]" },
    { label: "Usuarios no registrados", value: guest_sessions_count, color: "bg-[#eb6834] dark:bg-[#d95926]" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios con actividad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <p className="rounded-lg border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground">
            Todavía no hay usuarios con actividad registrada.
          </p>
        ) : (
          <div aria-hidden="true" className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-muted">
            {series.filter(({ value }) => value > 0).map(({ label, value, color }) => (
              <span key={label} className={cn("h-full", color)} style={{ width: `${(value / total) * 100}%` }} />
            ))}
          </div>
        )}
        <ul aria-label="Usuarios por tipo" className="flex flex-wrap gap-x-6 gap-y-2">
          {series.map(({ label, value, color }) => (
            <li key={label} className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-[3px]", color)} />
              <span className="text-muted-foreground">{label}:</span>
              <span className="font-semibold tabular-nums">{value.toLocaleString("es-CR")}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
