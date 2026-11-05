import { useEffect, useRef, useState } from "react"
import type { SubmitEvent } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { CheckoutBuyerFields } from "@/features/checkout/components/CheckoutBuyerFields"
import { CheckoutDeliveryFields } from "@/features/checkout/components/CheckoutDeliveryFields"
import { CheckoutDeliveryMethod } from "@/features/checkout/components/CheckoutDeliveryMethod"
import { CheckoutTermsAcceptance } from "@/features/checkout/components/CheckoutTermsAcceptance"
import { StoreSelector } from "@/features/stores/StoreSelector"
import { validate_buyer_fields, validate_delivery_fields, validate_terms_acceptance } from "@/lib/checkout/checkout"
import { get_name_from_hacienda, validate_identification } from "@/lib/identification/identification"
import type { BuyerInfo, CheckoutFormData, DeliveryInfo, DeliveryMethod } from "@/lib/checkout/types"
import { useCart } from "@/lib/cart/cartContext"
import { useStores } from "@/lib/stores/storesContext"

const pending_name_message = "Espera a que se complete la consulta del nombre antes de continuar."

type CheckoutFormProps = {
  formData: CheckoutFormData
  onChange: (form_data: CheckoutFormData) => void
  onSubmit: (form_data: CheckoutFormData) => Promise<void>
  isGeneratingOrder: boolean
  isAssigningStore: boolean
  storeAssignmentError?: string
  onRetryStore: () => void
}

export function CheckoutForm({ formData, onChange, onSubmit, isGeneratingOrder, isAssigningStore, storeAssignmentError, onRetryStore }: CheckoutFormProps) {
  const { can_checkout } = useCart()
  const { selected_store } = useStores()
  const formRef = useRef<HTMLFormElement>(null)
  const [buyerErrors, setBuyerErrors] = useState<Partial<Record<keyof BuyerInfo, string>>>({})
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<Record<keyof DeliveryInfo, string>>>({})
  const [deliveryMethodError, setDeliveryMethodError] = useState<string | undefined>()
  const [storeError, setStoreError] = useState<string | undefined>()
  const [termsError, setTermsError] = useState<string | undefined>()
  const [nameResult, setNameResult] = useState<{ key: string; full_name: string; error?: string } | null>(null)
  const identificationNumber = formData.buyer.identification_number.trim()
  const identificationType = formData.buyer.identification_type
  const isManual = identificationType === "Otro"
  const lookupKey = `${identificationType}:${identificationNumber}`
  const canLookupName = !isManual && validate_identification(identificationNumber, identificationType)
  const currentNameResult = canLookupName && nameResult?.key === lookupKey ? nameResult : null
  const lookupError = currentNameResult?.error
  const buyer: BuyerInfo = {
    ...formData.buyer,
    full_name: isManual ? formData.buyer.full_name : currentNameResult?.full_name ?? "",
  }

  useEffect(() => {
    if (!canLookupName) return
    let active = true
    const timer = window.setTimeout(async () => {
      try {
        const full_name = await get_name_from_hacienda(identificationNumber, identificationType)
        if (!active) return
        setNameResult({
          key: lookupKey,
          full_name: full_name ?? "",
          error: full_name ? undefined : "No se encontró un nombre para esta identificación. Revisa el número ingresado.",
        })
        setBuyerErrors((previous) => previous.identification_number === pending_name_message
          ? { ...previous, identification_number: undefined } : previous)
      } catch {
        if (!active) return
        setNameResult({ key: lookupKey, full_name: "", error: "No se pudo completar el nombre. Intenta nuevamente." })
        setBuyerErrors((previous) => previous.identification_number === pending_name_message
          ? { ...previous, identification_number: undefined } : previous)
      }
    }, 350)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [canLookupName, identificationNumber, identificationType, lookupKey])

  /**
   * Actualiza un campo del comprador y borra sus errores.
   * Elimina los números del nombre completo, conserva solo los dígitos de la identificación y los teléfonos, y limita la identificación a 12 dígitos y los teléfonos a 8.
   * Al cambiar el tipo de identificación, vacía el nombre completo.
   * @param field Campo del comprador.
   * @param value Valor nuevo.
   * @returns No retorna ningún valor.
   */
  function handleBuyerChange<Field extends keyof BuyerInfo>(field: Field, value: BuyerInfo[Field]) {
    if (field === "full_name" && !isManual) return
    const input_value = field === "full_name" && typeof value === "string" ? value.replace(/\p{N}/gu, "") : value
    const is_numeric = field === "phone_number" || field === "alternative_phone_number" || field === "identification_number"
    const filtered_value = is_numeric && typeof input_value === "string" ? input_value.replace(/\D/g, "") : input_value
    const next_value = is_numeric && typeof filtered_value === "string" ? filtered_value.slice(0, field === "identification_number" ? 12 : 8) : filtered_value
    const changes_identity = field === "identification_type" || field === "identification_number"
    onChange({
      ...formData,
      buyer: {
        ...formData.buyer,
        [field]: next_value,
        ...(field === "identification_type" ? {
          full_name: "",
          identification_number: formData.buyer.identification_number.replace(/\D/g, "").slice(0, 12),
        } : {}),
      },
    })
    setBuyerErrors((previous) => ({
      ...previous,
      [field]: undefined,
      ...(changes_identity ? { full_name: undefined, identification_number: undefined } : {}),
    }))
  }

  /**
   * Actualiza un campo de la entrega y vacía las ubicaciones que dependen de él.
   * Conserva solo los dígitos del código postal y limita su longitud a 5.
   * @param field Campo de la entrega.
   * @param value Valor nuevo.
   * @returns No retorna ningún valor.
   */
  function handleDeliveryChange(field: keyof DeliveryInfo, value: string) {
    const next_value = field === "postal_code" ? value.replace(/\D/g, "").slice(0, 5) : value
    const resets = field === "province" ? { canton: "", district: "" } : field === "canton" ? { district: "" } : {}
    onChange({ ...formData, delivery: { ...formData.delivery, [field]: next_value, ...resets } })
    setDeliveryErrors((previous) => ({
      ...previous,
      [field]: undefined,
      ...(field === "province" ? { canton: undefined, district: undefined, postal_code: undefined } : {}),
      ...(field === "canton" ? { district: undefined } : {}),
    }))
  }

  /**
   * Valida un campo del comprador al perder el foco sin reemplazar los demás errores.
   * @param field Campo del comprador que se desea validar.
   * @returns No retorna ningún valor.
   */
  function handleBuyerBlur(field: keyof BuyerInfo) {
    setBuyerErrors((previous) => ({ ...previous, [field]: validate_buyer_fields(buyer)[field] }))
  }

  /**
   * Valida un campo de la dirección al perder el foco sin reemplazar los demás errores.
   * @param field Campo de la dirección que se desea validar.
   * @returns No retorna ningún valor.
   */
  function handleDeliveryBlur(field: keyof DeliveryInfo) {
    setDeliveryErrors((previous) => ({ ...previous, [field]: validate_delivery_fields(formData.delivery)[field] }))
  }

  /**
   * Cambia la modalidad y descarta errores de entrega y tienda sin borrar la dirección escrita.
   * @param delivery_method Modalidad elegida para recibir el pedido.
   * @returns No retorna ningún valor.
   */
  function handleDeliveryMethodChange(delivery_method: DeliveryMethod): void {
    onChange({ ...formData, delivery_method })
    setDeliveryMethodError(undefined)
    setDeliveryErrors({})
    setStoreError(undefined)
  }

  /**
   * Marca o desmarca la aceptación de los términos, guardando la fecha ISO del momento en que se marca.
   * Al marcarla borra el mensaje de error; al desmarcarla elimina la fecha registrada.
   * @param checked Nuevo estado de la casilla.
   * @returns No retorna ningún valor.
   */
  function handleTermsChange(checked: boolean): void {
    onChange({ ...formData, terms_accepted_at: checked ? new Date().toISOString() : null })
    if (checked) setTermsError(undefined)
  }

  /**
   * Valida los datos del comprador y la entrega al enviar el formulario.
   * Si hay errores, los muestra y enfoca el primer campo inválido.
   * Espera un nombre válido de Hacienda cuando la identificación requiere consulta.
   * Exige modalidad y tienda, dirección solamente para envío y la aceptación de los términos.
   * Delega la preparación y generación al checkout cuando el formulario es válido.
   * @param event Evento de envío del formulario.
   * @returns Promesa que termina al procesar el formulario.
   */
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (isGeneratingOrder || isAssigningStore || !can_checkout) return
    const buyer_errors = validate_buyer_fields(buyer)
    const delivery_errors = formData.delivery_method === "SHIPPING" ? validate_delivery_fields(formData.delivery) : {}
    const delivery_method_error = formData.delivery_method === null ? "Selecciona envío o retiro para continuar." : undefined
    const store_error = selected_store || formData.delivery_method === null ? undefined
      : formData.delivery_method === "PICKUP" ? "Selecciona la tienda donde quieres retirar el pedido."
        : storeAssignmentError ?? "Selecciona una tienda para el envío antes de continuar."
    const terms_error = validate_terms_acceptance(formData.terms_accepted_at)

    if (!isManual && buyer_errors.full_name) {
      const name_error = buyer_errors.full_name
      delete buyer_errors.full_name
      buyer_errors.identification_number ??= lookupError ?? (
        canLookupName && !currentNameResult
          ? pending_name_message
          : name_error
      )
    }

    setBuyerErrors(buyer_errors)
    setDeliveryErrors(delivery_errors)
    setDeliveryMethodError(delivery_method_error)
    setStoreError(store_error)
    setTermsError(terms_error)
    const has_errors = Object.keys(buyer_errors).length > 0 || Object.keys(delivery_errors).length > 0 || Boolean(delivery_method_error) || Boolean(store_error) || Boolean(terms_error)
    if (!has_errors) {
      await onSubmit({ ...formData, buyer })
      return
    }
    
    window.requestAnimationFrame(() => {
      const invalid_field = formRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]:not(:disabled):not([aria-disabled="true"]):not([readonly]):not([type="hidden"])' +
        (store_error ? ", #checkout-store-retry" : ""),
      )
      invalid_field?.focus({ preventScroll: true })
      invalid_field?.scrollIntoView({ block: "center" })
    })
  }

  return (
    <form
      id="checkout-form"
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      aria-busy={isGeneratingOrder}
      aria-labelledby="checkout-form-title"
      className="min-w-0 rounded-xl border border-input bg-card p-5 sm:p-6"
    >
      <h2 id="checkout-form-title" className="text-lg font-semibold">1. Datos del cliente y entrega</h2>
      <fieldset disabled={isGeneratingOrder} className="min-w-0">
        <legend className="sr-only">Datos del cliente y entrega</legend>
        <FieldGroup className="mt-6 gap-7">
          <CheckoutBuyerFields
            buyer={buyer}
            errors={buyerErrors}
            lookupError={lookupError}
            onChange={handleBuyerChange}
            onBlur={handleBuyerBlur}
          />
          <FieldSeparator />
          <CheckoutDeliveryMethod
            value={formData.delivery_method}
            error={deliveryMethodError}
            onChange={handleDeliveryMethodChange}
          />
          <FieldSet aria-labelledby="checkout-store-title">
            <FieldLegend id="checkout-store-title" className="font-semibold">Tienda del pedido</FieldLegend>
            {formData.delivery_method === "PICKUP" ? (
              <Field data-invalid={Boolean(!selected_store && storeError)}>
                <FieldLabel htmlFor="checkout-pickup-store">Tienda de retiro (obligatorio)</FieldLabel>
                <StoreSelector id="checkout-pickup-store" label="Tienda de retiro" required
                  error={selected_store ? undefined : storeError} className="sm:w-full" onChange={() => setStoreError(undefined)} />
                <FieldDescription>{selected_store ? selected_store.province : "Elige el local donde quieres retirar tu pedido."}</FieldDescription>
                <FieldError id="checkout-pickup-store-error">{!selected_store && storeError}</FieldError>
              </Field>
            ) : selected_store ? (
              <div className="rounded-lg border border-input bg-muted/40 p-4">
                <p className="text-sm font-medium">{selected_store.locale_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selected_store.province}</p>
              </div>
            ) : isAssigningStore ? (
              <p role="status" className="text-sm text-muted-foreground">Buscando la tienda con mayor stock para tu pedido…</p>
            ) : storeAssignmentError ? (
              <div className="space-y-3">
                <FieldError id="checkout-store-assignment-error">{storeAssignmentError}</FieldError>
                <Button id="checkout-store-retry" type="button" variant="outline" className="cursor-pointer" onClick={onRetryStore}>Reintentar selección de tienda</Button>
              </div>
            ) : (
              <FieldDescription>Aún no hay una tienda seleccionada. Para envío elegiremos una según el stock; para retiro puedes elegir el local.</FieldDescription>
            )}
          </FieldSet>
          {formData.delivery_method === "SHIPPING" && (
            <CheckoutDeliveryFields delivery={formData.delivery} errors={deliveryErrors}
              onChange={handleDeliveryChange} onBlur={handleDeliveryBlur} />
          )}
          <FieldSeparator />
          <CheckoutTermsAcceptance checked={formData.terms_accepted_at !== null} error={termsError} onChange={handleTermsChange} />
        </FieldGroup>
      </fieldset>
    </form>
  )
}
