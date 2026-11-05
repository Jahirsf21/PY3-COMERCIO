import { MapPinIcon } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { get_store_groups } from "@/lib/stores/stores"
import { useStores } from "@/lib/stores/storesContext"
import { cn } from "@/lib/shared/utils"

type StoreSelectorProps = {
  id?: string
  label?: string
  required?: boolean
  error?: string
  className?: string
  onChange?: (store_id: string | null) => void
}

export function StoreSelector({ id, label = "Tienda", required = false, error, className, onChange }: StoreSelectorProps) {
  const { selected_store, select_store } = useStores()
  const groups = get_store_groups()
  return (
    <Select<string>
      value={selected_store?.id ?? "none"}
      required={required}
      items={[{ value: "none", label: "Seleccione su tienda" }, ...groups.flatMap((group) => group.stores.map((store) => ({ value: store.id, label: store.locale_name })))]}
      onValueChange={(value) => {
        if (value === null) return
        const store_id = value === "none" ? null : value
        select_store(store_id)
        onChange?.(store_id)
      }}
    >
      <SelectTrigger id={id} aria-label={label} aria-required={required} aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={cn("h-10 w-full min-w-0 cursor-pointer sm:w-52 data-[size=default]:h-10", className)}>
        <MapPinIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        <SelectItem value="none" className="cursor-pointer">Seleccione su tienda</SelectItem>
        {groups.map((group) => (
          <SelectGroup key={group.province}>
            <SelectLabel>{group.province}</SelectLabel>
            {group.stores.map((store) => <SelectItem key={store.id} value={store.id} className="cursor-pointer">{store.locale_name}</SelectItem>)}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
