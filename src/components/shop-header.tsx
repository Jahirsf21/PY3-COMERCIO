import { Link, NavLink, useLocation } from "react-router-dom"
import { UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActiveUserInfo } from "@/features/auth/components/ActiveUserInfo"
import { CartIndicator } from "@/features/cart/components/CartIndicator"
import { StoreSelector } from "@/features/stores/StoreSelector"
import { useAuth } from "@/lib/auth/authContext"
import { cn } from "@/lib/shared/utils"

const logo_url = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}icono.svg`
const admin_links = [
  { label: "Catálogo", to: "/" },
  { label: "Dashboard", to: "/admin" },
  { label: "Métricas del sitio", to: "/analytics" },
]

/**
 * Encabezado de la tienda con el logo, el selector de tienda, el carrito y el usuario activo.
 * El usuario activo aparece como un botón con sus iniciales junto al carrito; al presionarlo muestra su información
 * y sus accesos de cuenta. ADMIN tiene su propia navegación en el encabezado.
 * Sin sesión muestra el botón "Cuenta", que lleva al inicio de sesión, salvo en la propia pantalla de inicio de sesión.
 * @param props Propiedades del encabezado.
 * @param props.sticky Indica si el encabezado queda fijo al desplazarse.
 * @returns Encabezado de la tienda.
 */
export function ShopHeader({ sticky = false }: { sticky?: boolean }) {
  const { user } = useAuth()
  const location = useLocation()
  const is_login_page = location.pathname === "/login"
  const is_admin = user?.role === "ADMIN"

  return (
    <header data-admin-header={is_admin || undefined} className={cn(
      "shrink-0 items-center gap-3 border-b border-input px-4 py-3 lg:px-6",
      is_admin
        ? "grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
        : "flex flex-wrap justify-between",
      (sticky || is_admin) && "sticky top-0 z-40 bg-background",
    )}>
      <Link to="/" aria-label="Ir al catálogo" className="min-w-0 justify-self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <img src={logo_url} alt="" aria-hidden="true" className="size-14 object-contain dark:invert" />
      </Link>
      {is_admin && (
        <nav aria-label="Navegación del administrador" className="col-span-2 col-start-1 row-start-2 flex flex-wrap items-center justify-center gap-1 md:col-span-1 md:col-start-2 md:row-start-1 md:flex-nowrap">
          {admin_links.map(({ label, to }) => (
            <NavLink key={to} to={to} className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-muted aria-[current=page]:text-foreground sm:px-3">
              {label}
            </NavLink>
          ))}
        </nav>
      )}
      <div className={cn("flex min-w-0 items-center gap-3", is_admin && "col-start-2 row-start-1 justify-end md:col-start-3")}>
        <div className="min-w-0">
          <StoreSelector className={cn("w-auto max-w-44 sm:w-auto sm:max-w-60", is_admin && "md:max-w-full")} />
        </div>
        <nav aria-label="Navegación de la tienda" className="flex shrink-0 items-center gap-2">
          <CartIndicator />
          {user && <ActiveUserInfo user={user} />}
          {!user && !is_login_page && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/login" state={{ from: location }} />}
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
