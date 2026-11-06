import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog"

type LoginNoticeDialogProps = {
  open: boolean
  title: string
  message: string
  on_open_change: (open: boolean) => void
}

/**
 * Muestra en un diálogo el motivo por el que no se pudo iniciar sesión.
 * @param props Propiedades del diálogo.
 * @param props.open Indica si el diálogo está abierto.
 * @param props.title Título del aviso según el resultado del inicio de sesión.
 * @param props.message Mensaje recibido de login().
 * @param props.on_open_change Acción que recibe el nuevo estado de apertura.
 * @returns Diálogo con un aviso destructivo y un botón para cerrarlo.
 */
export function LoginNoticeDialog({ open, title, message, on_open_change }: LoginNoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={on_open_change}>
      <DialogContent showCloseButton={false} className="motion-reduce:animate-none">
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle><DialogTitle>{title}</DialogTitle></AlertTitle>
          <AlertDescription><DialogDescription>{message}</DialogDescription></AlertDescription>
        </Alert>
        <DialogFooter>
          <DialogClose render={<Button type="button" className="cursor-pointer" />}>
            Aceptar
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
