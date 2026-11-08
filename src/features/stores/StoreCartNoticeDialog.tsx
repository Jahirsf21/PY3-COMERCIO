import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useStores } from "@/lib/stores/storesContext"

export function StoreCartNoticeDialog() {
  const { cart_notice, dismiss_cart_notice } = useStores()
  return (
    <Dialog open={cart_notice !== null} onOpenChange={(open) => { if (!open) dismiss_cart_notice() }}>
      <DialogContent showCloseButton={false} className="motion-reduce:animate-none">
        <DialogHeader>
          <DialogTitle>Actualizamos tu carrito</DialogTitle>
          <DialogDescription>
            {cart_notice?.store ? `Ajustamos los productos al stock de ${cart_notice.store.locale_name}.` : "Ajustamos los productos al stock y las cantidades permitidas."}
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-[50dvh] space-y-3 overflow-y-auto py-1">
          {cart_notice?.changes.map((change) => (
            <li key={change.item_id} className="flex items-start gap-3 rounded-lg border border-input p-3 text-sm">
              <img src={change.image.url} alt={change.image.alt} loading="lazy" className="size-14 shrink-0 rounded-md bg-muted object-contain" />
              <div className="min-w-0 break-words">
                <p className="font-medium">{change.title} · Talla {change.selected_size}</p>
                <p className="mt-1 text-muted-foreground">
                  {change.quantity === 0 ? "No hay stock disponible para este producto." : `Cantidad ajustada de ${change.previous_quantity} a ${change.quantity}.`}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button type="button" className="cursor-pointer" />}>Entendido</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
