import { useSearchBox } from "react-instantsearch"
import { Input } from "@/components/ui/input"
import { useAnalytics } from "@/lib/analytics/analyticsContext"

export function SearchInput() {
  const { query, refine } = useSearchBox();
  const { track_search } = useAnalytics();
  return (
    <Input
      aria-label="Buscar productos"
      className="h-12 px-4 text-base transition-colors duration-150 hover:border-ring motion-reduce:transition-none md:text-base"
      value={query}
      onChange={(e) => {
        refine(e.target.value);
        track_search(e.target.value);
      }}
      placeholder="Buscar productos..."
    />
  );
}
