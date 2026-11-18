import { useId } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/shared/utils"
import { get_store_availability_text, get_store_groups } from "@/lib/stores/stores"
import { useStores } from "@/lib/stores/storesContext"
import type { StoreCartAvailability } from "@/lib/stores/types"

type CheckoutStoreSelectorProps = {
  label: string
  availability: StoreCartAvailability[] | null
  isChecking: boolean
  suggestedStoreId: string | null
  error?: string
  onSelect?: (store_id: string) => void
}

/**
 * Muestra las sedes con la disponibilidad del carrito y permite elegir la del pedido.
 * @param props Propiedades del componente.
 * @param props.label Nombre accesible del grupo.
 * @param props.availability Disponibilidad por sede, o null si aún no se conoce.
 * @param props.isChecking Indica si se está consultando la disponibilidad.
 * @param props.suggestedStoreId Sede sugerida, o null.
 * @param props.error Mensaje de error.
 * @param props.onSelect Se llama al elegir una sede.
 * @returns Selector de sedes.
 */
export function CheckoutStoreSelector({ label, availability, isChecking, suggestedStoreId, error, onSelect }: CheckoutStoreSelectorProps) {
  const id = useId()
  const { selected_store, select_store } = useStores()
  const groups = get_store_groups()

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={label}
        aria-required="true"
        aria-busy={isChecking}
        aria-describedby={error ? `${id}-error` : `${id}-status`}
        className="space-y-4"
      >
        {groups.map((group) => (
          <div key={group.province} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{group.province}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.stores.map((store) => {
                const store_availability = availability?.find((candidate) => candidate.store.id === store.id)
                const checked = selected_store?.id === store.id
                const has_missing = Boolean(store_availability && store_availability.unavailable_count > 0)
                const has_reduced = Boolean(store_availability && store_availability.reduced_count > 0)
                return (
                  <label
                    key={store.id}
                    className={cn(
                      "flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border border-input p-3 transition-colors hover:bg-muted/40 has-focus-visible:ring-2 has-focus-visible:ring-ring motion-reduce:transition-none",
                      checked && "border-primary bg-primary/5",
                      error && !selected_store && "border-destructive",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${id}-store`}
                      value={store.id}
                      checked={checked}
                      aria-invalid={Boolean(error && !selected_store)}
                      onChange={() => {
                        select_store(store.id)
                        onSelect?.(store.id)
                      }}
                      className="mt-1 size-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-none"
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {store.locale_name}
                        {suggestedStoreId === store.id && <Badge variant="secondary">Sugerida</Badge>}
                      </span>
                      <span className={cn(
                        "mt-1 block text-xs break-words",
                        has_missing ? "text-destructive" : has_reduced ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
                      )}>
                        {store_availability ? get_store_availability_text(store_availability) : isChecking ? "Comprobando disponibilidad…" : "Disponibilidad sin comprobar"}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p id={`${id}-status`} role="status" className="sr-only">
        {isChecking ? "Comprobando la disponibilidad de tu carrito en cada tienda." : ""}
      </p>
      {error && <p id={`${id}-error`} className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
