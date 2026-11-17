import { useId, useMemo } from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { ArrowUpDownIcon } from "lucide-react"
import { useSortBy } from "react-instantsearch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { get_product_indices } from "@/lib/algolia/algolia"
import { useChannel } from "@/lib/channel/channelContext"

export function SortBySelect({ floating = false }: { floating?: boolean }) {
  const id = useId();
  const { channel } = useChannel();
  const sort_items = useMemo(() => {
    const indices = get_product_indices(channel);
    return [
      { label: "Relevancia", value: indices.main },
      { label: "Precio: menor a mayor", value: indices.priceAsc },
      { label: "Precio: mayor a menor", value: indices.priceDesc },
    ];
  }, [channel]);
  const { currentRefinement, options, refine } = useSortBy({ items: sort_items });

  return (
    <div className={floating ? "" : "hidden flex-wrap items-center gap-2 lg:flex"}>
      <Label id={`${id}-label`} htmlFor={id} className={floating ? "sr-only" : undefined}>Ordenar por</Label>
      <Select
        items={options}
        value={currentRefinement}
        onValueChange={(value) => value !== null && refine(value)}
      >
        {floating ? (
          <SelectPrimitive.Trigger
            id={id}
            aria-labelledby={`${id}-label ${id}-value`}
            render={
              <Button className="h-10 w-full cursor-pointer gap-1.5 rounded-full px-4 text-xs shadow-lg hover:shadow-xl motion-reduce:transition-none" />
            }
          >
            <ArrowUpDownIcon aria-hidden="true" className="size-3.5" />
            Ordenar
            <SelectValue id={`${id}-value`} className="sr-only" />
          </SelectPrimitive.Trigger>
        ) : (
          <SelectTrigger
            id={id}
            size="sm"
            className="w-52"
            aria-labelledby={`${id}-label`}
          >
            <SelectValue placeholder="Selecciona el orden" />
          </SelectTrigger>
        )}
        <SelectContent
          alignItemWithTrigger={false}
          side={floating ? "top" : "bottom"}
          align="end"
          className="w-52"
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
