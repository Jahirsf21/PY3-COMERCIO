import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SearchIcon, PackageOpenIcon, TriangleAlertIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminInventoryTable } from "@/features/admin/components/AdminInventoryTable"
import { AdminPagination } from "@/features/admin/components/AdminPagination"
import type { User } from "@/lib/auth/types"
import { get_admin_inventory, type InventoryRow } from "@/lib/catalog/adminInventory"
import type { SalesChannel } from "@/lib/channel/types"

/**
 * Presenta las unidades por sucursal del canal seleccionado.
 * @param props Sesión ADMIN autorizada.
 * @returns Selector de canal y tabla paginada por SKU.
 */
export function AdminInventoryPanel({ user }: { user: User }) {
  const [channel, set_channel] = useState<SalesChannel>("b2c")
  const [attempt, set_attempt] = useState(0)
  const [response, set_response] = useState<{ user: User; channel: SalesChannel; attempt: number; rows: InventoryRow[] | null }>()
  const [query, set_query] = useState("")
  const [page, set_page] = useState(1)
  useEffect(() => {
    let active = true
    void get_admin_inventory(user, channel).then((rows) => {
      if (active) set_response({ user, channel, attempt, rows })
    }).catch(() => {
      if (active) set_response({ user, channel, attempt, rows: null })
    })
    return () => { active = false }
  }, [user, channel, attempt])
  const rows = response?.user === user && response.channel === channel && response.attempt === attempt ? response.rows : undefined
  const term = query.trim().toLocaleLowerCase("es")
  const matches = rows?.filter((row) => `${row.title} ${row.sku}`.toLocaleLowerCase("es").includes(term))
  const page_size = 12
  const channels = [{ value: "b2c", label: "B2C" }, { value: "b2b", label: "B2B" }]
  return <div className="space-y-4">
    <Card><CardContent className="flex items-end gap-3 sm:px-5">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor="inventory-query">Buscar productos</Label>
        <div className="relative"><SearchIcon aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="inventory-query" type="search" placeholder="Nombre o SKU" className="h-10 bg-background ps-9" value={query}
            onChange={(event) => { set_query(event.target.value); set_page(1) }} /></div>
      </div>
      <div className="w-24 space-y-1.5 sm:w-36">
        <Label htmlFor="inventory-channel">Canal</Label>
        <Select items={channels} value={channel} onValueChange={(value) => { if (value === "b2c" || value === "b2b") { set_channel(value); set_page(1) } }}>
          <SelectTrigger id="inventory-channel" className="w-full cursor-pointer bg-background data-[size=default]:h-10"><SelectValue /></SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>{channels.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </CardContent></Card>
    <Card className="gap-0 p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div><h2 className="font-semibold">Existencias por sucursal</h2>
          <p role="status" className="mt-1 text-xs text-muted-foreground">{matches ? `Variantes: ${matches.length}` : rows === undefined ? "Consultando inventario…" : ""}</p>
        </div>
        {!!matches?.length && <AdminPagination label="Páginas de inventario" page={page} total_pages={Math.ceil(matches.length / page_size)} on_page_change={set_page} />}
      </div>
      {rows === undefined ? <CardContent aria-hidden="true" className="space-y-2 py-4">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-16" />)}</CardContent> :
        rows === null ? <CardContent className="py-4"><Alert variant="destructive"><TriangleAlertIcon /><AlertTitle>No pudimos consultar el inventario</AlertTitle>
          <AlertDescription><Button variant="outline" size="sm" onClick={() => set_attempt(attempt + 1)}>Reintentar</Button></AlertDescription></Alert></CardContent> :
        matches?.length ? <AdminInventoryTable rows={matches.slice((page - 1) * page_size, page * page_size)} /> :
          <div className="flex flex-col items-center gap-2 p-10 text-center"><PackageOpenIcon aria-hidden="true" className="text-muted-foreground" />
            <p>{rows.length ? "No hay variantes para esta búsqueda." : "No hay variantes en este canal."}</p></div>}
    </Card>
  </div>
}
