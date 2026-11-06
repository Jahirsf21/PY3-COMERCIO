import { useState } from "react"
import type { ComponentProps, ComponentType } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/shared/utils"

type LoginInputFieldProps = Omit<ComponentProps<"input">, "type"> & {
  id: string
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  error?: string
  password?: boolean
}

/**
 * Campo del formulario de inicio de sesión con un ícono junto a la etiqueta y el error debajo.
 * Si es un campo de contraseña, agrega un botón para mostrarla u ocultarla.
 * @param props Propiedades del campo.
 * @param props.id Identificador del campo, usado también para el mensaje de error.
 * @param props.label Texto de la etiqueta.
 * @param props.icon Ícono decorativo que acompaña la etiqueta.
 * @param props.error Mensaje de error del campo, si existe.
 * @param props.password Indica si el campo es una contraseña.
 * @returns Campo con etiqueta, entrada y mensaje de error.
 */
export function LoginInputField({ id, label, icon: Icon, error, password = false, required, className, ...props }: LoginInputFieldProps) {
  const [is_visible, set_is_visible] = useState(false)

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="items-center gap-2 text-base font-semibold">
        <Icon aria-hidden className="size-5 shrink-0" />
        <span>
          {label}
          {required && <span className="font-normal"> (obligatorio)</span>}
        </span>
      </FieldLabel>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={password && !is_visible ? "password" : "text"}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("h-12 rounded-xl bg-background px-4 text-base md:text-base", password && "pr-12", className)}
        />
        {password && (
          <button
            type="button"
            onClick={() => set_is_visible((previous) => !previous)}
            aria-label={is_visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={is_visible}
            aria-controls={id}
            className="absolute inset-y-0 right-1.5 my-auto flex size-9 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {is_visible ? <EyeOffIcon aria-hidden="true" className="size-5" /> : <EyeIcon aria-hidden="true" className="size-5" />}
          </button>
        )}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  )
}
