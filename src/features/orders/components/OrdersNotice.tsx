import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useOrders } from "@/lib/orders/ordersContext"

/**
 * Muestra los avisos de los pedidos y permite reintentar la sincronización.
 * @returns Avisos de los pedidos, o null si no hay ninguno.
 */
export function OrdersNotice() {
  const { storage_error, orders_read_status, has_pending_order_sync, retry_order_sync } = useOrders()
  const read_failed = orders_read_status === "error"
  if (!storage_error && !read_failed && !has_pending_order_sync) return null

  return (
    <>
      {storage_error && (
        <Alert variant="destructive" className="mb-6">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>No pudimos guardar tus pedidos</AlertTitle>
          <AlertDescription>Revisa los permisos de almacenamiento de tu navegador.</AlertDescription>
        </Alert>
      )}
      {(read_failed || has_pending_order_sync) && (
        <Alert className="mb-6">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>{read_failed ? "No pudimos consultar el historial" : "Cambios pendientes de sincronizar"}</AlertTitle>
          <AlertDescription>
            <p>{has_pending_order_sync && !storage_error
              ? "Los cambios están guardados en este navegador. Reintentar no repite el pago."
              : "Puedes consultar los pedidos disponibles en este navegador."}</p>
            <Button type="button" variant="outline" size="sm" onClick={retry_order_sync}>Reintentar</Button>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
