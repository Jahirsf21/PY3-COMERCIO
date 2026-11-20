import { useState } from "react"
import { Link, useMatch } from "react-router-dom"
import { ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { CartPreview } from "@/features/cart/components/CartPreview"
import { useCart } from "@/lib/cart/cartContext"
import { useAuth } from "@/lib/auth/authContext"
import { routes } from "@/lib/navigation/routes"

const cart_control_class = "relative size-10 shrink-0 cursor-pointer"

export function CartIndicator() {
  const { user } = useAuth()
  const { total_items: totalUnits } = useCart()
  const [open, setOpen] = useState(false)
  const isCartPage = useMatch(routes.cart) !== null

  const indicator = (
    <>
      <ShoppingCartIcon aria-hidden="true" className="size-5" />
      <span aria-live="polite" aria-atomic="true" className="pointer-events-none absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-primary px-1 text-[11px] font-bold tabular-nums text-primary-foreground">
        {totalUnits}
      </span>
    </>
  )

  if (user?.role === "ADMIN") return null

  if (isCartPage) {
    return (
      <Link
        to={routes.cart}
        aria-current="page"
        aria-label={`Carrito: ${totalUnits} ${totalUnits === 1 ? "unidad" : "unidades"}`}
        className={`${cart_control_class} inline-flex items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {indicator}
      </Link>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={`Vista previa del carrito: ${totalUnits} ${totalUnits === 1 ? "unidad" : "unidades"}`}
        render={<Button type="button" variant="outline" size="icon" className={cart_control_class} />}
      >
        {indicator}
      </SheetTrigger>
      <CartPreview onClose={() => setOpen(false)} />
    </Sheet>
  )
}
