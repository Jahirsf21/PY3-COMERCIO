import { Link, useLocation } from "react-router-dom"
import { ChartColumnIcon, ClipboardListIcon, ExternalLinkIcon, LogOutIcon, PackageIcon, WarehouseIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth/authContext"
import { get_initials } from "@/lib/auth/auth"
import type { User } from "@/lib/auth/types"
import { routes, store_url } from "@/lib/navigation/routes"

const logo_url = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}icono.svg`
const admin_sections = [
  { label: "Órdenes", to: routes.admin_orders, icon: ClipboardListIcon },
  { label: "Productos", to: routes.admin_products, icon: PackageIcon },
  { label: "Inventario", to: routes.admin_inventory, icon: WarehouseIcon },
  { label: "Analytics", to: routes.admin_analytics, icon: ChartColumnIcon },
]
const item_class = "h-10 cursor-pointer gap-3 text-sidebar-foreground/75 data-active:[&_svg]:text-sidebar-primary"

/**
 * Navegación lateral del panel ADMIN: secciones, acceso a la tienda en otra pestaña y cierre de sesión.
 * @param props Sesión ADMIN activa.
 * @returns Sidebar contraíble a íconos en escritorio y en sheet en celular.
 */
export function AdminSidebar({ user }: { user: User }) {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  /**
   * Cierra el sheet de celular al elegir una opción.
   * @returns No retorna ningún valor.
   */
  function close_mobile(): void {
    if (isMobile) setOpenMobile(false)
  }

  /**
   * Cierra la sesión y lo confirma con un aviso.
   * @returns No retorna ningún valor.
   */
  function handle_logout(): void {
    logout()
    toast.add({ title: "Sesión cerrada", description: "Vuelve a iniciar sesión para acceder a tu cuenta.", type: "success" })
  }

  return (
    <Sidebar collapsible="icon" aria-label="Navegación del panel">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to={routes.admin_orders}
          onClick={close_mobile}
          className="flex items-center gap-3 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <img src={logo_url} alt="" aria-hidden="true" className="size-8 shrink-0 object-contain dark:invert" />
          <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-heading font-semibold">Space Shop</span>
            <span className="truncate text-xs text-muted-foreground">Panel administrativo</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-[0.14em] uppercase">Administración</SidebarGroupLabel>
          <SidebarMenu>
            {admin_sections.map(({ label, to, icon: Icon }) => {
              const is_active = pathname === to || (to === routes.admin_orders && pathname.startsWith(`${to}/`))
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    isActive={is_active}
                    tooltip={label}
                    className={item_class}
                    render={<Link to={to} onClick={close_mobile} aria-current={is_active ? "page" : undefined} />}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Ver tienda"
                className={item_class}
                render={<a href={store_url()} target="_blank" rel="noopener noreferrer" onClick={close_mobile} />}
              >
                <ExternalLinkIcon aria-hidden="true" />
                <span>Ver tienda<span className="sr-only"> (abre en una pestaña nueva)</span></span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:p-0">
          <Avatar>
            <AvatarFallback aria-hidden="true" className="bg-primary text-xs font-semibold text-primary-foreground">{get_initials(user.full_name)}</AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-heading text-sm font-semibold">{user.full_name}</span>
            <span className="truncate text-xs text-muted-foreground">Administrador</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handle_logout}
            aria-label="Cerrar sesión"
            className="shrink-0 cursor-pointer"
          >
            <LogOutIcon aria-hidden="true" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
