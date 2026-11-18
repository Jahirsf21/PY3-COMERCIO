import type { AccountIdentity } from "@/lib/auth/types"
import type { OrderCustomer } from "@/lib/orders/types"

/**
 * Muestra la cuenta que realizó la orden.
 * @param props Cuenta y tipo de cliente registrados.
 * @returns Identidad de la cuenta o un aviso si no está disponible.
 */
export function AdminOrderAccount({ account, role }: { account: AccountIdentity | null; role: OrderCustomer["role"] }) {
  if (role === "GUEST") return <span className="text-muted-foreground">Invitado (sin cuenta)</span>
  if (!account) return <span className="text-muted-foreground">Cuenta no disponible</span>
  return (
    <span className="block wrap-anywhere">
      <span className="block font-medium">{account.full_name}</span>
      <span className="block text-xs text-muted-foreground">@{account.username}</span>
    </span>
  )
}
