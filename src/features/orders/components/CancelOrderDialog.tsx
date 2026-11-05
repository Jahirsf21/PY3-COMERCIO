import { useState } from "react"
import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { useOrders } from "@/lib/orders/ordersContext"
import type { OrderDetails } from "@/lib/orders/types"

type CancelOrderDialogProps = {
  order: OrderDetails
}

export function CancelOrderDialog({ order }: CancelOrderDialogProps) {
  const { cancel_order } = useOrders()
  const [open, set_open] = useState(false)
  const [error_message, set_error_message] = useState<string | null>(null)

  /**
   * Cancela el pedido una sola vez y anuncia el éxito únicamente si se guarda correctamente.
   * @returns No retorna ningún valor.
   */
  function confirm_cancellation(): void {
    set_error_message(null)
    try {
      if (!cancel_order(order.id)) {
        set_error_message("No pudimos cancelar el pedido. Revisa su estado e intenta nuevamente.")
        return
      }
      set_open(false)
      toast.add({ title: `Pedido #${order.order_number} cancelado`, type: "success" })
    } catch {
      set_error_message("No pudimos cancelar el pedido. Intenta nuevamente.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next_open) => {
      set_open(next_open)
      if (next_open) set_error_message(null)
    }}>
      <DialogTrigger render={<Button type="button" variant="outline" className="cursor-pointer text-destructive" />}>
        Cancelar pedido
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="motion-reduce:animate-none">
        <DialogHeader>
          <DialogTitle>¿Cancelar el pedido #{order.order_number}?</DialogTitle>
          <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        {error_message && (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertDescription>{error_message}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" className="cursor-pointer" />}>
            Volver
          </DialogClose>
          <Button type="button" variant="destructive" className="cursor-pointer" onClick={confirm_cancellation}>
            Cancelar pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
