import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/lib/auth/types"
import { commercial_fields, describe_target, save_product_update, validate_edit_value, type EditTarget } from "@/lib/catalog/productUpdates"
import type { SalesChannel } from "@/lib/channel/types"
import type { Store } from "@/lib/stores/types"

/** Campos editables de una oferta o tallas de una sede. */
export type EditSelection = { sku: string; channel: SalesChannel } & (
  { store: Store; sizes: Record<string, number> } | { offer: Record<keyof typeof commercial_fields, number> }
)

/**
 * Edita un único valor y comunica el resultado confirmado.
 * @param props Selección inicial, sesión y acciones de cierre y actualización.
 * @returns Formulario del campo o talla elegida.
 */
export function ProductEditor({ selection, user, on_close, on_saved }: {
  selection: EditSelection; user: User; on_close: () => void; on_saved: () => void
}) {
  const targets: EditTarget[] = "store" in selection ? Object.entries(selection.sizes).map(([size, before]) => ({
    sku: selection.sku, channel: selection.channel, field: "stock", store: selection.store, size, before,
  })) : (Object.keys(commercial_fields) as (keyof typeof commercial_fields)[]).map((field) => ({
    sku: selection.sku, channel: selection.channel, field, before: selection.offer[field],
  }))
  const [index, set_index] = useState(0)
  const target = targets[index]
  const [value, set_value] = useState(String(target.before))
  const [busy, set_busy] = useState(false)
  const validation = validate_edit_value(target.field, value)
  const items = targets.map((item, i) => ({ value: i, label: item.field === "stock" ? item.size : commercial_fields[item.field] }))

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) on_close() }}>
    <DialogContent showCloseButton={!busy} className="max-h-[90dvh] overflow-y-auto">
      <DialogTitle>{"store" in selection ? "Editar inventario" : "Editar producto"}</DialogTitle>
      <DialogDescription>{selection.sku} · {selection.channel.toUpperCase()}{"store" in selection && ` · ${selection.store.locale_name}`}</DialogDescription>
      <form className="grid gap-4" onSubmit={async (event) => {
        event.preventDefault()
        if (busy || validation || Number(value) === target.before) return
        set_busy(true)
        try {
          const description = await save_product_update(user, target, Number(value))
          on_saved()
          toast.add({ type: "success", title: target.field === "stock" ? "Inventario actualizado" : "Producto actualizado", description })
        } catch (error) {
          const description = error instanceof Error ? error.message : "No se pudo confirmar el cambio."
          on_close()
          toast.add({ type: "error", title: "Cambio sin confirmar", description })
        }
      }}>
        <div className="grid gap-1.5"><Label htmlFor="edit-product-field">{"store" in selection ? "Talla" : "Campo"}</Label>
          <Select items={items} value={index} disabled={busy} onValueChange={(i) => {
            if (i !== null && targets[i]) { set_index(i); set_value(String(targets[i].before)) }
          }}><SelectTrigger id="edit-product-field" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
        </div>
        <p className="text-muted-foreground">{describe_target(target)} · Valor actual: <strong>{target.before}</strong></p>
        <div className="grid gap-1.5"><Label htmlFor="edit-product-value">Nuevo valor</Label>
          <Input id="edit-product-value" type="text" inputMode="numeric" aria-invalid={Boolean(validation)} aria-describedby={validation ? "edit-value-error" : undefined}
            value={value} onChange={(event) => set_value(event.target.value)} disabled={busy} required />
          {validation && <p id="edit-value-error" role="status" className="text-xs text-destructive">{validation}</p>}</div>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={on_close}>Cerrar</Button>
          <Button type="submit" disabled={busy || Boolean(validation) || Number(value) === target.before}>{busy ? "Guardando…" : "Guardar"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
