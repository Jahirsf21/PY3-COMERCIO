/**
 * Tipos de identificación disponibles para la persona compradora: nacional, extranjero u otro
 */
export type IdentificationType = "Nacional" | "Extranjero" | "Otro";

/**
 * Información de identificación y contacto de la persona compradora
 */
export type BuyerInfo = {
    full_name: string
    identification_type: IdentificationType
    identification_number: string
    email: string
    alternative_email?: string
    phone_number: string
    alternative_phone_number?: string
}

/**
 * Dirección de entrega del pedido
 */
export type DeliveryInfo = {
    country: string
    province: string
    canton: string
    district: string
    address: string
    postal_code: string
    additional_information: string
}

/**
 * Modalidad para recibir el pedido; la dirección solo es obligatoria para envío.
 */
export type DeliveryMethod = "SHIPPING" | "PICKUP"

/**
 * Registro de la aceptación de los Términos y Condiciones y la Política de Privacidad.
 * acceptedAt es la fecha y hora ISO en que la persona marcó la casilla.
 */
export type TermsAcceptance = {
    accepted: true
    acceptedAt: string
}

/**
 * Datos editables del comprador y entrega; la modalidad empieza sin seleccionar.
 * terms_accepted_at empieza en null (casilla desmarcada) y guarda la fecha ISO en que se marcó la casilla.
 */
export type CheckoutFormData = {
    buyer: BuyerInfo
    delivery_method: DeliveryMethod | null
    delivery: DeliveryInfo
    terms_accepted_at: string | null
}
