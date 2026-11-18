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

const action_class = "h-11 cursor-pointer rounded-xl px-4 focus-visible:border-foreground/60 focus-visible:ring-foreground/25 motion-reduce:transition-none sm:min-w-28"

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
        className="block max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl p-0 shadow-2xl motion-reduce:animate-none sm:max-w-md"
        overlayClassName="bg-black/40 motion-reduce:animate-none"
      >
        <DialogHeader className={cn("gap-0 bg-linear-to-br via-transparent to-transparent p-5 sm:px-7 sm:py-6", is_warning ? "from-amber-500/10" : "from-destructive/8")}>
          <div className="mb-4 flex items-center gap-3">
            <span className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
              is_warning ? "border-amber-500/20 bg-amber-500/12 text-amber-700 dark:text-amber-400" : "border-destructive/15 bg-destructive/10 text-destructive",
            )}>
              <NoticeIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{context_label}</span>
          </div>
          <DialogTitle className="text-xl leading-tight font-semibold tracking-tight wrap-anywhere sm:text-2xl">{title}</DialogTitle>
          <DialogDescription className="mt-2 leading-relaxed wrap-anywhere sm:text-base">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="m-0 flex-col rounded-none bg-muted/50 px-5 sm:px-7">
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
