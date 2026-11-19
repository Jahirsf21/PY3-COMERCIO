import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { ShopFooter } from "@/components/shop-footer"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminCatalogPanel } from "@/features/admin/components/AdminCatalogPanel"
import { AdminOrdersPanel } from "@/features/admin/components/AdminOrdersPanel"
import { AdminSidebar } from "@/features/admin/components/AdminSidebar"
import { AnalyticsOverview } from "@/features/analytics/AnalyticsPage"
import type { User } from "@/lib/auth/types"
import { routes } from "@/lib/navigation/routes"

/** Sección del panel que corresponde a la ruta actual. */
type AdminSection = "orders" | "products" | "analytics" | "order"

const section_titles: Record<AdminSection, string> = {
  orders: "Órdenes",
  products: "Productos",
  analytics: "Analytics",
  order: "Detalle de la orden",
}

/**
 * Obtiene la sección del panel a partir de la ruta.
 * @param pathname Ruta actual.
 * @returns Sección activa.
 */
function get_admin_section(pathname: string): AdminSection {
  if (pathname === routes.admin_products) return "products"
  if (pathname === routes.admin_analytics) return "analytics"
  if (pathname.startsWith(`${routes.admin_orders}/`)) return "order"
  return "orders"
}

/**
 * Encabezado de una sección del panel.
 * @param props Título y descripción.
 * @returns Título de la página y su descripción.
 */
function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

/**
 * Layout del panel ADMIN: sidebar, barra superior con la sección y pie de página.
 * Órdenes y Productos quedan montados al cambiar de sección para conservar su búsqueda y su página.
 * @param props Sesión ADMIN autorizada por la ruta.
 * @returns Panel con la sección de la ruta actual.
 */
export default function AdminLayout({ user }: { user: User }) {
  const { pathname } = useLocation()
  const section = get_admin_section(pathname)
  const [products_opened, set_products_opened] = useState(section === "products")
  if (section === "products" && !products_opened) set_products_opened(true)

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger aria-label="Mostrar u ocultar la navegación" className="-ml-1 cursor-pointer" />
          <Separator orientation="vertical" className="h-5" />
          <span className="font-heading text-lg font-semibold">{section_titles[section]}</span>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div hidden={section !== "orders"}>
            <SectionHeading title="Órdenes" description="Consulta todas las órdenes registradas en la tienda." />
            <AdminOrdersPanel user={user} />
          </div>
          {products_opened && (
            <div hidden={section !== "products"}>
              <SectionHeading title="Productos" description="Compara los precios y las condiciones de compra de B2C y B2B." />
              <AdminCatalogPanel user={user} />
            </div>
          )}
          {section === "analytics" && <AnalyticsOverview />}
          <Outlet />
        </div>
        <ShopFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}
