import { Link } from "react-router-dom"
import { BrandHeader } from "@/components/brand-header"
import { CartIndicator } from "@/features/cart/components/CartIndicator"
import { StoreSelector } from "@/features/stores/StoreSelector"
import { cn } from "@/lib/shared/utils"

export function ShopHeader({ sticky = false }: { sticky?: boolean }) {
  return (
    <header className={cn(
      "flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-input px-4 py-3 lg:px-6",
      sticky && "sticky top-0 z-40 bg-background",
    )}>
      <Link to="/" aria-label="Ir al catálogo" className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandHeader heading={false} />
      </Link>
      <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
        <div className="min-w-0 flex-1 sm:flex-none"><StoreSelector /></div>
        <nav aria-label="Navegación de la tienda" className="flex shrink-0 items-center gap-2">
          <CartIndicator />
        </nav>
      </div>
    </header>
  )
}
