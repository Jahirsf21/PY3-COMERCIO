import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog"

type PaymentNoticeDialogProps = {
  open: boolean
  title: string
  message: string
  on_open_change: (open: boolean) => void
  on_retry?: () => boolean
}

export function PaymentNoticeDialog({ open, title, message, on_open_change, on_retry }: PaymentNoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={on_open_change}>
      <DialogContent showCloseButton={false} className="motion-reduce:animate-none">
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle><DialogTitle>{title}</DialogTitle></AlertTitle>
          <AlertDescription><DialogDescription>{message}</DialogDescription></AlertDescription>
        </Alert>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant={on_retry ? "outline" : "default"} className="cursor-pointer" />}>
            {on_retry ? "Cerrar" : "Aceptar"}
          </DialogClose>
          {on_retry && (
            <Button type="button" onClick={() => { if (on_retry()) on_open_change(false) }} className="cursor-pointer">
              Reintentar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
