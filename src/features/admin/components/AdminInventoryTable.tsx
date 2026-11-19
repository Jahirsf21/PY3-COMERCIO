import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderThumbnail } from "@/features/orders/components/OrderThumbnail"
import { inventory_stores, type InventoryRow } from "@/lib/catalog/adminInventory"

/**
 * Presenta las existencias y la foto de cada variante en tabla o tarjetas.
 * @param props Variantes de la página actual.
 * @returns Inventario por sede con identificación visual del SKU.
 */
export function AdminInventoryTable({ rows }: { rows: InventoryRow[] }) {
  return <>
    <div className="hidden lg:block">
      <Table>
        <TableCaption className="sr-only">Existencias por variante y sucursal</TableCaption>
        <TableHeader className="bg-muted/60"><TableRow>
          <TableHead scope="col" className="w-20 pl-5">Foto</TableHead>
          <TableHead scope="col">Producto / SKU</TableHead>
          {inventory_stores.map((store) => <TableHead scope="col" key={store.id} className="border-l px-3 text-end whitespace-normal">{store.locale_name}</TableHead>)}
        </TableRow></TableHeader>
        <TableBody>{rows.map((row) => <TableRow key={row.sku}>
          <TableCell className="py-3 pl-5"><OrderThumbnail image={row.image} items_count={1} size="sm" /></TableCell>
          <th scope="row" className="px-2 text-start text-sm font-semibold wrap-anywhere">{row.title}<span className="block font-mono text-xs font-normal text-muted-foreground">{row.sku}</span></th>
          {inventory_stores.map((store) => <TableCell key={store.id} className="border-l px-3 text-end tabular-nums">{row.quantities.get(store.id) ?? "Sin registro"}</TableCell>)}
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <ul aria-label="Inventario por variante" className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">{rows.map((row) =>
      <li key={row.sku}><Card size="sm"><CardContent className="space-y-3">
        <div className="flex items-center gap-3"><OrderThumbnail image={row.image} items_count={1} size="sm" />
          <div className="min-w-0 wrap-anywhere"><h3 className="text-sm font-semibold">{row.title}</h3><p className="font-mono text-xs text-muted-foreground">{row.sku}</p></div>
        </div>
        <dl className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/35 p-2 text-xs">{inventory_stores.map((store) =>
          <div key={store.id}><dt className="text-muted-foreground">{store.locale_name}</dt><dd className="font-semibold tabular-nums">{row.quantities.get(store.id) ?? "Sin registro"}</dd></div>
        )}</dl>
      </CardContent></Card></li>
    )}</ul>
  </>
}
