import { CircleAlertIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/shared/utils"

/** Propiedades de un aviso modal. */
type NoticeDialogProps = {
  open: boolean
  context_label: string
  title: string
  message: string
  tone?: "error" | "warning"
  on_open_change: (open: boolean) => void
  on_retry?: () => boolean
}

const action_class = "h-11 w-full cursor-pointer px-5 font-semibold motion-reduce:transition-none sm:flex-1"

/**
 * Presenta un aviso con una acción de cierre y, si está disponible, un reintento.
 * @param props Contenido, estado y acciones del aviso.
 * @returns Diálogo con título y descripción accesibles.
 */
export function NoticeDialog({ open, context_label, title, message, tone = "error", on_open_change, on_retry }: NoticeDialogProps) {
  const is_warning = tone === "warning"
  const NoticeIcon = is_warning ? TriangleAlertIcon : CircleAlertIcon

  /**
   * Ejecuta la acción de reintento y cierra el aviso solo si se completó.
   * @returns No retorna ningún valor.
   */
  function retry_notice(): void {
    if (on_retry?.()) on_open_change(false)
  }

  return (
    <Dialog open={open} onOpenChange={on_open_change}>
      <DialogContent
        showCloseButton={false}
        className="block max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border bg-card p-0 shadow-2xl motion-reduce:animate-none sm:max-w-md"
        overlayClassName="bg-black/50 motion-reduce:animate-none"
      >
        <DialogHeader className="items-center gap-0 px-6 pt-7 pb-5 text-center sm:px-8">
          <span className={cn(
            "mb-4 flex size-14 shrink-0 items-center justify-center rounded-lg",
            is_warning ? "bg-amber-500/12 text-amber-700 dark:text-amber-400" : "bg-destructive/10 text-destructive",
          )}>
            <NoticeIcon aria-hidden="true" className="size-7" />
          </span>
          <span className="mb-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{context_label}</span>
          <DialogTitle className="text-xl leading-tight font-bold tracking-tight wrap-anywhere sm:text-2xl">{title}</DialogTitle>
          <DialogDescription className="mt-2 leading-relaxed wrap-anywhere sm:text-base">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="m-0 flex-col-reverse gap-2 rounded-none border-t-0 bg-transparent px-6 pt-0 pb-6 sm:flex-row sm:px-8">
          <DialogClose render={<Button type="button" variant={on_retry ? "outline" : "default"} className={action_class} />}>
            {on_retry ? "Cerrar" : "Aceptar"}
          </DialogClose>
          {on_retry && (
            <Button type="button" onClick={retry_notice} className={action_class}>
              <RotateCwIcon aria-hidden="true" />
              Reintentar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
