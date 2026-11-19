import { useState } from "react"
import { ClipboardListIcon, PackageIcon, ShieldCheckIcon } from "lucide-react"
import { ShopHeader } from "@/components/shop-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminCatalogPanel } from "@/features/admin/components/AdminCatalogPanel"
import { AdminOrdersPanel } from "@/features/admin/components/AdminOrdersPanel"
import type { User } from "@/lib/auth/types"

/** Secciones habilitadas del panel administrativo. */
type AdminSection = "orders" | "products"

/**
 * Agrupa las consultas del ADMIN sin reiniciar sus listados al cambiar de pestaña.
 * @param props Sesión ADMIN autorizada por la ruta.
 * @returns Panel administrativo con Órdenes como sección inicial.
 */
export default function AdminDashboardPage({ user }: { user: User }) {
  const [section, set_section] = useState<AdminSection>("orders")
  const [has_opened_products, set_has_opened_products] = useState(false)

  /**
   * Cambia de pestaña e inicia el catálogo solo al abrir Productos por primera vez.
   * @param value Valor emitido por el control de pestañas.
   * @returns No retorna ningún valor.
   */
  function change_section(value: unknown): void {
    if (value !== "orders" && value !== "products") return
    set_section(value)
    if (value === "products") set_has_opened_products(true)
  }

  return (
    <div className="min-h-dvh bg-muted/35">
      <ShopHeader sticky />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 sm:mb-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            <ShieldCheckIcon aria-hidden="true" className="size-4" />
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Panel administrativo</h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {section === "orders" ? "Consulta todas las órdenes registradas en la tienda" : "Compara los precios y las condiciones de compra de B2C y B2B."}
          </p>
        </div>
        <Tabs value={section} onValueChange={change_section} className="gap-3">
          <div className="border-b border-border">
            <TabsList variant="line" aria-label="Secciones administrativas" className="group-data-horizontal/tabs:h-10">
              <TabsTrigger value="orders" className="cursor-pointer px-3">
                <ClipboardListIcon aria-hidden="true" />
                Órdenes
              </TabsTrigger>
              <TabsTrigger value="products" className="cursor-pointer px-3">
                <PackageIcon aria-hidden="true" />
                Productos
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="orders" keepMounted>
            <AdminOrdersPanel user={user} />
          </TabsContent>
          <TabsContent value="products" keepMounted>
            {has_opened_products && <AdminCatalogPanel user={user} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
