import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminOrderAccount } from "@/features/admin/components/AdminOrderAccount"
import { OrderThumbnail } from "@/features/orders/components/OrderThumbnail"
import { order_customer_labels, order_status_labels, payment_status_labels } from "@/features/admin/orderLabels"
import { format_order_date } from "@/lib/orders/orders"
import type { AdminOrderSummary } from "@/lib/orders/types"
import { cn, format_price } from "@/lib/shared/utils"
import { admin_order_path } from "@/lib/navigation/routes"

const badge_tones = {
  neutral: "border-border bg-muted text-muted-foreground",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200",
}

/** Apariencia de una etiqueta de estado. */
type BadgeTone = keyof typeof badge_tones

const order_tones: Record<AdminOrderSummary["status"], BadgeTone> = { PENDING: "warning", CONFIRMED: "success", CANCELLED: "error" }
const payment_tones: Record<NonNullable<AdminOrderSummary["payment_status"]>, BadgeTone> = {
  PENDING: "warning", APPROVE: "success", DECLINED: "error", ERROR: "error",
}

/**
 * Muestra un estado con texto y color.
 * @param props Etiqueta y apariencia del estado.
 * @returns Insignia de estado.
 */
function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", badge_tones[tone])}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  )
}

/**
 * Distingue los pagos registrados de las órdenes sin intento de pago.
 * @param props Estado del pago.
 * @returns Insignia del pago.
 */
function PaymentBadge({ status }: { status: AdminOrderSummary["payment_status"] }) {
  return status === null
    ? <StatusBadge label="Sin intento" tone="neutral" />
    : <StatusBadge label={payment_status_labels[status]} tone={payment_tones[status]} />
}

/**
 * Enlaza una orden con su detalle administrativo.
 * @param props Orden que se desea consultar.
 * @returns Enlace al detalle.
 */
function OrderDetailLink({ order }: { order: AdminOrderSummary }) {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<Link to={admin_order_path(order.id)} />}
      aria-label={`Ver detalle de ${order.order_number}`}
      className="h-8 cursor-pointer"
    >
      Ver detalle
    </Button>
  )
}

/**
 * Muestra las órdenes en una tabla y usa tarjetas en pantallas estrechas.
 * @param props Órdenes en el orden devuelto por la búsqueda.
 * @returns Resultados de la consulta administrativa.
 */
export function AdminOrdersTable({ orders }: { orders: AdminOrderSummary[] }) {
  return (
    <>
      <div className="hidden lg:block">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Órdenes registradas</TableCaption>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead scope="col" className="w-[21%] pl-5">Orden</TableHead>
              <TableHead scope="col" className="w-[14%]">Cuenta</TableHead>
              <TableHead scope="col" className="w-[12%]">Destinatario</TableHead>
              <TableHead scope="col" className="w-[10%]">Sucursal</TableHead>
              <TableHead scope="col" className="w-[10%] pr-3 text-right">Total</TableHead>
              <TableHead scope="col" className="w-[11%] px-1">Estado</TableHead>
              <TableHead scope="col" className="w-[11%] px-1">Pago</TableHead>
              <TableHead scope="col" className="w-[11%] pr-4 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="py-3 pr-4 pl-5 whitespace-normal">
                  <div className="flex items-center gap-3">
                    <OrderThumbnail image={order.first_item_image} items_count={order.items_count} size="sm" />
                    <div className="min-w-0 space-y-1">
                      <span className="block font-mono text-xs font-medium wrap-anywhere">{order.order_number}</span>
                      <time dateTime={order.created_at} className="block text-xs text-muted-foreground">{format_order_date(order.created_at)}</time>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="space-y-1 py-3 whitespace-normal">
                  <AdminOrderAccount account={order.account} role={order.role} />
                  {order.company_name && <p className="text-xs wrap-anywhere text-muted-foreground">{order.company_name}</p>}
                  {order.role !== "GUEST" && <Badge variant="outline">{order_customer_labels[order.role]}</Badge>}
                </TableCell>
                <TableCell className="wrap-anywhere whitespace-normal">{order.recipient_name}</TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">{order.store.locale_name}</TableCell>
                <TableCell className="pr-3 text-right font-semibold wrap-anywhere whitespace-normal tabular-nums">{format_price(order.total, order.currency)}</TableCell>
                <TableCell className="px-1"><StatusBadge label={order_status_labels[order.status]} tone={order_tones[order.status]} /></TableCell>
                <TableCell className="px-1"><PaymentBadge status={order.payment_status} /></TableCell>
                <TableCell className="pr-4 text-right"><OrderDetailLink order={order} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul aria-label="Órdenes registradas" className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:hidden">
        {orders.map((order) => (
          <li key={order.id} className="min-w-0">
            <Card size="sm" className="h-full gap-3">
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <OrderThumbnail image={order.first_item_image} items_count={order.items_count} size="sm" />
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-mono text-xs font-semibold wrap-anywhere">{order.order_number}</h3>
                    <time dateTime={order.created_at} className="block text-xs text-muted-foreground">{format_order_date(order.created_at)}</time>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-2">
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Cuenta</dt>
                    <dd className="mt-1 space-y-1">
                      <AdminOrderAccount account={order.account} role={order.role} />
                      {order.company_name && <p className="text-xs wrap-anywhere text-muted-foreground">{order.company_name}</p>}
                      {order.role !== "GUEST" && <Badge variant="outline">{order_customer_labels[order.role]}</Badge>}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Destinatario</dt>
                    <dd className="mt-1 font-medium wrap-anywhere">{order.recipient_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sucursal</dt>
                    <dd className="mt-1">{order.store.locale_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Total</dt>
                    <dd className="mt-1 font-semibold wrap-anywhere tabular-nums">{format_price(order.total, order.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Estado de la orden</dt>
                    <dd className="mt-1"><StatusBadge label={order_status_labels[order.status]} tone={order_tones[order.status]} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Estado del pago</dt>
                    <dd className="mt-1"><PaymentBadge status={order.payment_status} /></dd>
                  </div>
                </dl>
                <div className="flex justify-end border-t pt-2"><OrderDetailLink order={order} /></div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
