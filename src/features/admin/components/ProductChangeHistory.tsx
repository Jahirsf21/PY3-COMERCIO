import { get_product_history } from "@/lib/catalog/productUpdates"
import type { User } from "@/lib/auth/types"

/** Presenta el historial guardado en este navegador. @param props Sesión administrativa. @returns Lista de resultados. */
export function ProductChangeHistory({ user }: { user: User }) {
  const entries = get_product_history(user)
  if (!entries.length) return null
  return <details className="rounded-xl border bg-card p-4 text-sm"><summary className="cursor-pointer font-semibold">Historial de cambios ({entries.length})</summary>
    <ul className="mt-3 max-h-64 space-y-2 overflow-auto">{entries.map((entry, index) => <li key={index}>{entry}</li>)}</ul>
  </details>
}
