import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import type { DeliveryMethod } from "@/lib/checkout/types"

type CheckoutDeliveryMethodProps = {
  value: DeliveryMethod | null
  error?: string
  onChange: (value: DeliveryMethod) => void
}

const delivery_methods = [
  { value: "SHIPPING", label: "Envío", description: "Recibe el pedido en tu dirección." },
  { value: "PICKUP", label: "Retiro", description: "Retira el pedido sin cargo de envío." },
] as const

export function CheckoutDeliveryMethod({ value, error, onChange }: CheckoutDeliveryMethodProps) {
  return (
    <FieldSet>
      <FieldLegend className="font-semibold">¿Cómo quieres recibir tu pedido? (obligatorio)</FieldLegend>
      <div className="grid gap-3 sm:grid-cols-2">
        {delivery_methods.map((method) => (
          <label key={method.value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
            <input id={`delivery-method-${method.value.toLowerCase()}`} type="radio" name="delivery_method"
              value={method.value} required checked={value === method.value}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
              aria-invalid={Boolean(error)}
              aria-describedby={`delivery-method-${method.value.toLowerCase()}-description${error ? " delivery-method-error" : ""}`}
              onChange={() => onChange(method.value)} />
            <span>
              <span className="text-sm font-medium">{method.label}</span>
              <span id={`delivery-method-${method.value.toLowerCase()}-description`} className="mt-1 block text-sm text-muted-foreground">{method.description}</span>
            </span>
          </label>
        ))}
      </div>
      {value === "PICKUP" && <FieldDescription>No necesitas ingresar una dirección de entrega.</FieldDescription>}
      <FieldError id="delivery-method-error">{error}</FieldError>
    </FieldSet>
  )
}
