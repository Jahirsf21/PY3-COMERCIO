import { Link, useLocation } from "react-router-dom"
import { UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActiveUserInfo } from "@/features/auth/components/ActiveUserInfo"
import { CartIndicator } from "@/features/cart/components/CartIndicator"
import { StoreSelector } from "@/features/stores/StoreSelector"
import { useAuth } from "@/lib/auth/authContext"
import { cn } from "@/lib/shared/utils"
import { routes } from "@/lib/navigation/routes"

const logo_url = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}icono.svg`

/**
 * Encabezado de la tienda con el logo, el selector de tienda, el carrito y el usuario activo.
 * El usuario activo aparece como un botón con sus iniciales junto al carrito; al presionarlo muestra su información
 * y sus accesos de cuenta. ADMIN no ve el carrito; su panel se abre aparte y la tienda se consulta desde «Ver tienda».
 * Sin sesión muestra el botón "Cuenta", que lleva al inicio de sesión, salvo en la propia pantalla de inicio de sesión.
 * @param props Propiedades del encabezado.
 * @param props.sticky Indica si el encabezado queda fijo al desplazarse.
 * @returns Encabezado de la tienda.
 */
export function ShopHeader({ sticky = false }: { sticky?: boolean }) {
  const { user } = useAuth()
  const location = useLocation()
  const is_login_page = location.pathname === routes.login
  const is_admin = user?.role === "ADMIN"

  return (
    <header data-admin-header={is_admin || undefined} className={cn(
      "flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 lg:px-6",
      (sticky || is_admin) && "sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80",
    )}>
      <Link to={routes.catalog} aria-label="Ir al catálogo" className="min-w-0 justify-self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <img src={logo_url} alt="" aria-hidden="true" className={cn("object-contain dark:invert", is_login_page ? "size-14" : "size-11")} />
      </Link>
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0">
          <StoreSelector className="w-auto max-w-44 sm:w-auto sm:max-w-60 max-sm:[&_[data-slot=select-value]]:sr-only" />
        </div>
        <nav aria-label="Navegación de la tienda" className="flex shrink-0 items-center gap-2">
          <CartIndicator />
          {user && <ActiveUserInfo user={user} />}
          {!user && !is_login_page && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={routes.login} state={{ from: location }} />}
              aria-label="Cuenta: iniciar sesión"
              className="h-10 cursor-pointer gap-2 px-3"
            >
              <UserIcon aria-hidden="true" className="size-5" />
              <span className="hidden sm:inline">Cuenta</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
