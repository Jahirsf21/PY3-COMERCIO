import { FieldError } from "@/components/ui/field"
import { PolicyLink } from "@/components/policy-link"

type CheckoutTermsAcceptanceProps = {
  checked: boolean
  error?: string
  onChange: (checked: boolean) => void
}

/**
 * Casilla para aceptar los Términos y Condiciones y la Política de Privacidad antes de generar la orden.
 * Usa un checkbox nativo dentro de su label, con el mismo estilo de tarjeta que la modalidad de entrega,
 * para que toda la tarjeta sea un área táctil cómoda en móvil. Nunca se marca automáticamente.
 * Los enlaces abren las políticas en una pestaña nueva y no cambian el estado de la casilla.
 * @param props Propiedades de la casilla.
 * @param props.checked Indica si la persona marcó la casilla.
 * @param props.error Mensaje de validación que se muestra junto a la casilla.
 * @param props.onChange Acción que recibe el nuevo estado de la casilla.
 * @returns Casilla de aceptación con sus enlaces y su mensaje de error.
 */
export function CheckoutTermsAcceptance({ checked, error, onChange }: CheckoutTermsAcceptanceProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="checkout-terms"
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[[aria-invalid=true]]:border-destructive">
        <input id="checkout-terms" type="checkbox" name="terms_accepted" required checked={checked}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "checkout-terms-error" : undefined}
          onChange={(event) => onChange(event.currentTarget.checked)} />
        <span className="text-sm leading-relaxed">
          He leído y acepto los <PolicyLink to="/politicas-y-ayuda#terminos-y-condiciones">Términos y Condiciones</PolicyLink> y
          la <PolicyLink to="/politicas-y-ayuda#politica-de-privacidad">Política de Privacidad</PolicyLink>.
        </span>
      </label>
      <FieldError id="checkout-terms-error">{error}</FieldError>
    </div>
  )
}
