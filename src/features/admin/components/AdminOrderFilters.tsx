import { useId } from "react"
import { RotateCcwIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { order_customer_labels, order_status_labels, payment_status_labels } from "@/features/admin/orderLabels"
import type { AdminOrderSearchInput } from "@/lib/orders/types"
import { get_store_groups } from "@/lib/stores/stores"

const store_labels = Object.fromEntries(get_store_groups().flatMap(({ stores }) => stores.map((store) => [store.id, store.locale_name])))

/** Propiedades de un filtro desplegable. */
type FilterSelectProps<Value extends string> = {
  label: string
  any_label: string
  labels: Record<Value, string>
  value?: Value
  on_change: (value: Value | undefined) => void
}

/**
 * Muestra un filtro con una opción para quitarlo.
 * @param props Etiqueta, valores y acción del filtro.
 * @returns Selector de un criterio.
 */
function FilterSelect<Value extends string>({ label, any_label, labels, value, on_change }: FilterSelectProps<Value>) {
  const label_id = useId()
  const items = (Object.keys(labels) as Value[]).map((key) => ({ value: key, label: labels[key] }))
  const options = [{ value: "", label: any_label }, ...items]

  return (
    <div className="min-w-0 space-y-1.5">
      <Label id={label_id} htmlFor={`${label_id}-trigger`}>{label}</Label>
      <Select<string>
        value={value ?? ""}
        items={options}
        onValueChange={(next) => on_change(items.find((item) => item.value === next)?.value)}
      >
        <SelectTrigger id={`${label_id}-trigger`} aria-labelledby={label_id} className="w-full min-w-0 cursor-pointer bg-background data-[size=default]:h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value} className="cursor-pointer">{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Propiedades de la búsqueda y los filtros del panel. */
type AdminOrderFiltersProps = {
  filters: AdminOrderSearchInput
  has_filters: boolean
  on_change: (patch: AdminOrderSearchInput) => void
  on_clear: () => void
}

/**
 * Permite buscar y combinar los filtros de órdenes.
 * @param props Criterios y acciones para actualizarlos.
 * @returns Campo de búsqueda y filtros.
 */
export function AdminOrderFilters({ filters, has_filters, on_change, on_clear }: AdminOrderFiltersProps) {
  return (
    <Card>
      <CardContent className="space-y-3 sm:px-5">
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="admin-order-query">Buscar órdenes</Label>
            <div className="relative">
              <SearchIcon aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-order-query"
                type="search"
                value={filters.query ?? ""}
                onChange={(event) => on_change({ query: event.target.value })}
                placeholder="Número, destinatario o empresa"
                autoComplete="off"
                className="h-10 bg-background ps-9"
              />
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 cursor-pointer" disabled={!has_filters} onClick={on_clear}>
            <RotateCcwIcon aria-hidden="true" />
            Limpiar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FilterSelect label="Tipo de cliente" any_label="Todos los tipos" labels={order_customer_labels} value={filters.role} on_change={(role) => on_change({ role })} />
          <FilterSelect label="Sucursal" any_label="Todas las sucursales" labels={store_labels} value={filters.store_id} on_change={(store_id) => on_change({ store_id })} />
          <FilterSelect label="Estado de la orden" any_label="Todos los estados" labels={order_status_labels} value={filters.status} on_change={(status) => on_change({ status })} />
          <FilterSelect label="Estado del pago" any_label="Todos los estados" labels={payment_status_labels} value={filters.payment_status} on_change={(payment_status) => on_change({ payment_status })} />
        </div>
      </CardContent>
    </Card>
  )
}
