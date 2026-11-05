import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useOrders } from "@/lib/orders/ordersContext"

export function OrdersNotice() {
  const { storage_error } = useOrders()
  if (!storage_error) return null

  return (
    <Alert variant="destructive" className="mb-6">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>No pudimos guardar tus pedidos</AlertTitle>
      <AlertDescription>Revisa los permisos de almacenamiento de tu navegador.</AlertDescription>
    </Alert>
  )
}
