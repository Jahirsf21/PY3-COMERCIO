import type { BuyerInfo, DeliveryInfo, TermsAcceptance } from "@/lib/checkout/types"
import type { OrderAvailability, OrderDetails, OrderItem, OrderPagination, OrderStatus, PrepareOrderInput, PrepareOrderResult, PreparedOrder, PreparedOrderItem } from "@/lib/orders/types"
import type { Payment, PaymentResult } from "@/lib/payments/types"
import { get_cart_shipping_cost, get_cart_subtotal, get_cart_tax, get_item_subtotal, parse_cart_data } from "@/lib/cart/cart"
import { get_cart_validation } from "@/lib/catalog/catalog"
import { is_valid_terms_date, validate_buyer_fields, validate_delivery_fields, validate_terms_acceptance } from "@/lib/checkout/checkout"
import { get_store } from "@/lib/stores/stores"
import { get_stored_json, is_nonempty_string, is_positive_integer, is_record, is_valid_currency, is_valid_image, is_valid_price, save_stored_list } from "@/lib/shared/utils"

/**
 * Valida comprador, entrega, stock y precios de una sola sede, sin guardar ni cobrar.
 * Exige dirección solo para envío; para retiro prepara dirección nula y costo de envío cero.
 * Rechaza el pedido si no se aceptaron los términos y registra la aceptación con la fecha en que se marcó la casilla.
 * Solicita revisar el carrito si cambian precios o cantidades permitidas.
 * @param input Formulario con el nombre del comprador resuelto, carrito completo y tienda elegida.
 * @returns Promesa con los datos preparados, una solicitud de revisión, un rechazo o un error de consulta.
 */
export async function prepare_order(input: PrepareOrderInput): Promise<PrepareOrderResult> {
  const buyer = { ...input.buyer }
  const delivery = { ...input.delivery }
  const delivery_method = input.delivery_method
  const selected_store = get_store(input.store?.id ?? null)
  if (!selected_store) return { status: "rejected", message: "Selecciona una tienda para el pedido." }
  const store = { ...selected_store }
  if (delivery_method !== "SHIPPING" && delivery_method !== "PICKUP") {
    return { status: "rejected", message: "Selecciona envío o retiro para el pedido." }
  }
  const buyer_error = Object.values(validate_buyer_fields(buyer))[0]
  if (buyer_error) return { status: "rejected", message: buyer_error }
  if (delivery_method === "SHIPPING") {
    const delivery_error = Object.values(validate_delivery_fields(delivery))[0]
    if (delivery_error) return { status: "rejected", message: delivery_error }
  }
  const terms_error = validate_terms_acceptance(input.terms_accepted_at)
  if (terms_error || !is_valid_terms_date(input.terms_accepted_at)) return { status: "rejected", message: terms_error ?? "" }
  const terms_acceptance: TermsAcceptance = { accepted: true, acceptedAt: input.terms_accepted_at }
  const cart = parse_cart_data(input.cart)
  if (cart.length === 0 || cart.length !== input.cart.length) {
    return { status: "rejected", message: "Revisa los productos y cantidades del carrito antes de preparar el pedido." }
  }
  if (new Set(cart.map((item) => item.currency)).size !== 1) {
    return { status: "rejected", message: "Los productos del pedido deben tener una misma moneda." }
  }
  try {
    const validations = await get_cart_validation(cart, store)
    if (validations.some((validation) => validation.status === "error")) {
      return { status: "error", message: "No pudimos comprobar todos los productos de la tienda. Intenta nuevamente." }
    }
    if (validations.some((validation) => validation.status !== "valid" ||
      validation.item.unit_price !== validation.original_item.unit_price || validation.item.currency !== validation.original_item.currency)) {
      return { status: "review", message: "El stock o los precios cambiaron. Actualiza y revisa el carrito antes de generar el pedido.", validations }
    }
    const checked_cart = validations.map((validation) => validation.item)
    const subtotal = get_cart_subtotal(checked_cart)
    const tax = get_cart_tax(checked_cart)
    const shipping = delivery_method === "PICKUP" ? 0 : get_cart_shipping_cost(checked_cart)
    const total = subtotal + tax + shipping
    if (!is_valid_price(total)) return { status: "rejected", message: "Los montos del pedido superan el importe permitido." }
    const items: PreparedOrderItem[] = checked_cart.map((item) => ({
      product_id: item.product_id,
      sku: item.sku,
      selected_size: item.selected_size,
      title: item.title,
      image: { ...item.image },
      unit_price: item.unit_price,
      quantity: item.quantity,
      subtotal: get_item_subtotal(item),
    }))
    return { status: "ready", order: {
      buyer, store, delivery_method, delivery: delivery_method === "PICKUP" ? null : delivery,
      currency: checked_cart[0].currency, subtotal, tax, shipping, total, items, termsAcceptance: terms_acceptance,
    } }
  } catch {
    return { status: "error", message: "No pudimos comprobar los productos de la tienda. Intenta nuevamente." }
  }
}

/**
 * Valida la información de la persona compradora de un pedido.
 * Requiere el nombre, el tipo y número de identificación, el correo y el teléfono; los contactos alternativos son opcionales.
 * @param buyer Información de la persona compradora sin validar.
 * @returns Información con los textos sin espacios externos, o null si es inválida.
 */
function parse_order_buyer(buyer: unknown): BuyerInfo | null {
  if (!is_record(buyer) || !is_nonempty_string(buyer.full_name) ||
    (buyer.identification_type !== "Nacional" && buyer.identification_type !== "Extranjero" && buyer.identification_type !== "Otro") ||
    !is_nonempty_string(buyer.identification_number) || !is_nonempty_string(buyer.email) || !is_nonempty_string(buyer.phone_number) ||
    (buyer.alternative_email !== undefined && typeof buyer.alternative_email !== "string") ||
    (buyer.alternative_phone_number !== undefined && typeof buyer.alternative_phone_number !== "string")) {
    return null
  }

  return {
    full_name: buyer.full_name.trim(),
    identification_type: buyer.identification_type,
    identification_number: buyer.identification_number.trim(),
    email: buyer.email.trim(),
    alternative_email: typeof buyer.alternative_email === "string" ? buyer.alternative_email.trim() : undefined,
    phone_number: buyer.phone_number.trim(),
    alternative_phone_number: typeof buyer.alternative_phone_number === "string" ? buyer.alternative_phone_number.trim() : undefined,
  }
}

/**
 * Valida la dirección de entrega de un pedido.
 * Requiere el país, la provincia, el cantón, el distrito, la dirección y el código postal; las indicaciones adicionales pueden estar vacías.
 * @param delivery Dirección de entrega sin validar.
 * @returns Dirección con los textos sin espacios externos, o null si es inválida.
 */
function parse_order_delivery(delivery: unknown): DeliveryInfo | null {
  if (!is_record(delivery) || !is_nonempty_string(delivery.country) || !is_nonempty_string(delivery.province) ||
    !is_nonempty_string(delivery.canton) || !is_nonempty_string(delivery.district) || !is_nonempty_string(delivery.address) ||
    !is_nonempty_string(delivery.postal_code) || typeof delivery.additional_information !== "string") {
    return null
  }

  return {
    country: delivery.country.trim(),
    province: delivery.province.trim(),
    canton: delivery.canton.trim(),
    district: delivery.district.trim(),
    address: delivery.address.trim(),
    postal_code: delivery.postal_code.trim(),
    additional_information: delivery.additional_information.trim(),
  }
}

/**
 * Valida la aceptación de los términos de un pedido.
 * Los pedidos sin una aceptación válida, como los guardados antes de exigirla, se descartan.
 * @param terms_acceptance Aceptación sin validar.
 * @returns Aceptación validada, o null si accepted no es true o acceptedAt no es una fecha válida.
 */
function parse_order_terms_acceptance(terms_acceptance: unknown): TermsAcceptance | null {
  if (!is_record(terms_acceptance) || terms_acceptance.accepted !== true || !is_valid_terms_date(terms_acceptance.acceptedAt)) return null
  return { accepted: true, acceptedAt: terms_acceptance.acceptedAt }
}

/**
 * Valida un producto de un pedido.
 * Comprueba los identificadores, la talla, el título, la imagen, la cantidad, el precio unitario y el subtotal.
 * @param raw_item Producto sin validar.
 * @param order_id Identificador del pedido al que debe pertenecer.
 * @returns Producto con los textos sin espacios externos, o null si es inválido.
 */
function parse_order_item(raw_item: unknown, order_id: string): OrderItem | null {
  if (!is_record(raw_item) || !is_nonempty_string(raw_item.id) || raw_item.order_id !== order_id ||
    !is_nonempty_string(raw_item.product_id) || !is_nonempty_string(raw_item.sku) || !is_nonempty_string(raw_item.selected_size) ||
    !is_nonempty_string(raw_item.title) || !is_valid_image(raw_item.image) || !is_positive_integer(raw_item.quantity) ||
    !is_valid_price(raw_item.unit_price, raw_item.quantity) || !is_valid_price(raw_item.subtotal)) {
    return null
  }

  return {
    id: raw_item.id.trim(),
    order_id,
    product_id: raw_item.product_id.trim(),
    sku: raw_item.sku.trim(),
    selected_size: raw_item.selected_size.trim(),
    title: raw_item.title.trim(),
    image: { url: raw_item.image.url.trim(), alt: raw_item.image.alt },
    unit_price: raw_item.unit_price,
    quantity: raw_item.quantity,
    subtotal: raw_item.subtotal,
  }
}

/**
 * Valida el pago de un pedido.
 * Comprueba los identificadores, la fecha, el monto, la moneda y el estado, y que pertenezca al pedido y coincida con su total y moneda.
 * @param raw_payment Pago sin validar.
 * @param order Identificador, total y moneda del pedido.
 * @returns Pago validado, o null si es inválido.
 */
function parse_order_payment(raw_payment: unknown, order: Pick<OrderDetails, "id" | "total" | "currency">): Payment | null {
  if (!is_record(raw_payment) || !is_nonempty_string(raw_payment.id) || raw_payment.order_id !== order.id ||
    typeof raw_payment.created_at !== "string" || Number.isNaN(Date.parse(raw_payment.created_at)) ||
    !is_valid_price(raw_payment.amount) || raw_payment.amount !== order.total ||
    !is_valid_currency(raw_payment.currency) || raw_payment.currency !== order.currency ||
    (raw_payment.status !== "PENDING" && raw_payment.status !== "APPROVE" && raw_payment.status !== "DECLINED" && raw_payment.status !== "ERROR")) {
    return null
  }

  return {
    id: raw_payment.id.trim(),
    order_id: order.id,
    created_at: raw_payment.created_at,
    amount: raw_payment.amount,
    currency: raw_payment.currency,
    status: raw_payment.status,
  }
}

/**
 * Valida los datos de los pedidos y conserva los que tienen una estructura válida.
 * Por cada pedido:
 * - Valida el identificador, el número, la fecha, la moneda, los montos y el estado.
 * - Valida la persona compradora, la entrega y los productos mediante parse_order_buyer(), parse_order_delivery() y parse_order_item().
 * - Valida la aceptación de los términos mediante parse_order_terms_acceptance().
 * - Valida que payment sea null o un pago válido según parse_order_payment(), y que su estado sea compatible con el pedido.
 * - Descarta los pedidos con un identificador o número repetido.
 * @param orders_data Datos de los pedidos sin validar.
 * @returns Pedidos con una estructura válida.
 */
export function parse_orders_data(orders_data: unknown): OrderDetails[] {
  if (!Array.isArray(orders_data)) return []
  const orders_by_id = new Map<string, OrderDetails>()
  const order_numbers = new Set<number>()

  for (const raw_order of orders_data) {
    if (!is_record(raw_order) || !is_nonempty_string(raw_order.id) || !is_positive_integer(raw_order.order_number) ||
      typeof raw_order.created_at !== "string" || Number.isNaN(Date.parse(raw_order.created_at)) || !is_valid_currency(raw_order.currency) ||
      !is_valid_price(raw_order.subtotal) || !is_valid_price(raw_order.tax) || !is_valid_price(raw_order.shipping) || !is_valid_price(raw_order.total) ||
      (raw_order.status !== "PENDING" && raw_order.status !== "CONFIRMED" && raw_order.status !== "CANCELLED") ||
      (raw_order.delivery_method !== "SHIPPING" && raw_order.delivery_method !== "PICKUP") ||
      !Array.isArray(raw_order.items) || raw_order.items.length === 0) {
      continue
    }

    const order_id = raw_order.id.trim()
    const store = is_record(raw_order.store) && typeof raw_order.store.id === "string" ? get_store(raw_order.store.id) : null
    const buyer = parse_order_buyer(raw_order.buyer)
    const delivery = raw_order.delivery_method === "SHIPPING" ? parse_order_delivery(raw_order.delivery) : null
    const items = raw_order.items.map((raw_item) => parse_order_item(raw_item, order_id))
    const terms_acceptance = parse_order_terms_acceptance(raw_order.termsAcceptance)
    const payment = raw_order.payment === null ? null : parse_order_payment(raw_order.payment, { id: order_id, total: raw_order.total, currency: raw_order.currency })
    const has_inconsistent_payment = (raw_order.status === "CONFIRMED" && payment?.status !== "APPROVE") ||
      (raw_order.status !== "CONFIRMED" && payment?.status === "APPROVE") ||
      (raw_order.status === "CANCELLED" && payment?.status === "PENDING")
    if (!store || !buyer || !terms_acceptance || (raw_order.delivery_method === "SHIPPING" && !delivery) ||
      (raw_order.delivery_method === "PICKUP" && (raw_order.delivery !== null || raw_order.shipping !== 0)) ||
      items.some((item) => item === null) || (raw_order.payment !== null && !payment) ||
      has_inconsistent_payment || orders_by_id.has(order_id) || order_numbers.has(raw_order.order_number)) {
      continue
    }

    orders_by_id.set(order_id, {
      id: order_id,
      order_number: raw_order.order_number,
      created_at: raw_order.created_at,
      buyer,
      store: { ...store },
      delivery_method: raw_order.delivery_method,
      delivery,
      currency: raw_order.currency,
      subtotal: raw_order.subtotal,
      tax: raw_order.tax,
      shipping: raw_order.shipping,
      total: raw_order.total,
      status: raw_order.status,
      termsAcceptance: terms_acceptance,
      items: items.filter((item) => item !== null),
      payment,
    })
    order_numbers.add(raw_order.order_number)
  }
  return [...orders_by_id.values()]
}

/**
 * Obtiene los pedidos guardados en localStorage y los valida mediante parse_orders_data().
 * @returns Pedidos válidos, o un arreglo vacío si no se pueden recuperar.
 */
export function get_stored_orders(): OrderDetails[] {
  return parse_orders_data(get_stored_json("space-shop-orders"))
}

/**
 * Guarda los pedidos en localStorage, o elimina la clave si no hay pedidos.
 * @param orders Pedidos que se desean guardar.
 * @returns true si se guardó; false si el navegador rechaza la operación.
 */
export function save_orders(orders: OrderDetails[]): boolean {
  return save_stored_list("space-shop-orders", orders)
}

/**
 * Calcula el siguiente número consecutivo de pedido.
 * @param orders Pedidos existentes.
 * @returns Número mayor registrado más uno, o 1 si no hay pedidos.
 */
export function get_next_order_number(orders: OrderDetails[]): number {
  return orders.reduce((max_number, order) => Math.max(max_number, order.order_number), 0) + 1
}

/**
 * Asigna identificadores a un producto ya verificado.
 * @param item Producto preparado.
 * @param order_id Identificador del pedido.
 * @returns Producto del pedido con el subtotal verificado.
 */
export function create_order_item(item: PreparedOrderItem, order_id: string): OrderItem {
  return {
    id: crypto.randomUUID(),
    order_id,
    product_id: item.product_id,
    sku: item.sku,
    selected_size: item.selected_size,
    title: item.title,
    image: { ...item.image },
    unit_price: item.unit_price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }
}

/**
 * Crea un pedido PENDING con los datos verificados, sin recalcularlos desde otro carrito o sede.
 * Copia la aceptación de los términos y nunca crea un pedido sin una aceptación válida.
 * @param prepared_order Datos preparados.
 * @param order_number Número del pedido.
 * @returns Pedido creado sin pago, o null si no tiene productos, un consecutivo válido o la aceptación de los términos.
 */
export function create_order(prepared_order: PreparedOrder, order_number: number): OrderDetails | null {
  if (prepared_order.items.length === 0 || !is_positive_integer(order_number)) return null
  const terms_acceptance = parse_order_terms_acceptance(prepared_order.termsAcceptance)
  if (!terms_acceptance) return null
  const order_id = crypto.randomUUID()
  return {
    id: order_id,
    order_number,
    created_at: new Date().toISOString(),
    buyer: { ...prepared_order.buyer },
    store: { ...prepared_order.store },
    delivery_method: prepared_order.delivery_method,
    delivery: prepared_order.delivery ? { ...prepared_order.delivery } : null,
    currency: prepared_order.currency,
    subtotal: prepared_order.subtotal,
    tax: prepared_order.tax,
    shipping: prepared_order.shipping,
    total: prepared_order.total,
    status: "PENDING",
    termsAcceptance: terms_acceptance,
    items: prepared_order.items.map((item) => create_order_item(item, order_id)),
    payment: null,
  }
}

/**
 * Divide los productos guardados de un pedido en páginas de cuatro elementos, sin modificarlos.
 * Ajusta la página solicitada al rango disponible y usa la primera si el valor es inválido.
 * @param items Productos guardados en el pedido.
 * @param requested_page Página solicitada, empezando en 1; por defecto, 1.
 * @returns Productos de la página actual y cantidades de páginas y productos.
 */
export function get_order_pagination(items: OrderItem[], requested_page = 1): OrderPagination {
  const items_per_page = 4
  const total_products = items.length
  const total_pages = Math.ceil(total_products / items_per_page)
  const valid_page = Number.isSafeInteger(requested_page) && requested_page > 0 ? requested_page : 1
  const current_page = Math.min(valid_page, Math.max(total_pages, 1))
  const first_item_index = (current_page - 1) * items_per_page

  return {
    page_items: items.slice(first_item_index, first_item_index + items_per_page),
    current_page,
    total_pages,
    total_products,
  }
}

/**
 * Agrega un pedido al inicio de la lista.
 * @param state Estado actual de los pedidos.
 * @param new_order Pedido que se desea agregar.
 * @returns Pedidos actualizados, o el mismo estado si ya existe un pedido con el mismo id o número.
 */
export function add_order(state: OrderDetails[], new_order: OrderDetails): OrderDetails[] {
  if (state.some((order) => order.id === new_order.id || order.order_number === new_order.order_number)) return state
  return [new_order, ...state]
}

/**
 * Cancela un pedido pendiente que no tenga un pago en proceso o aprobado.
 * Conserva los productos y el último pago, sin permitir reactivar el pedido.
 * @param state Estado actual de los pedidos.
 * @param order_id Identificador del pedido.
 * @returns Pedidos actualizados, o el mismo estado si el pedido no existe o no admite cancelación.
 */
export function cancel_order(state: OrderDetails[], order_id: string): OrderDetails[] {
  const order = state.find((current_order) => current_order.id === order_id)
  if (!order || order.status !== "PENDING" || order.payment?.status === "PENDING" || order.payment?.status === "APPROVE") return state
  return state.map((current_order) =>
    current_order.id === order_id ? { ...current_order, status: "CANCELLED" } : current_order,
  )
}

/**
 * Obtiene el motivo por el que un pedido no admite un nuevo pago.
 * @param order Pedido que se desea pagar.
 * @returns Mensaje si el pedido no está PENDING o su pago está PENDING o APPROVE; null si se puede pagar.
 */
export function get_order_payment_block(order: OrderDetails): string | null {
  if (order.status === "CONFIRMED" || order.payment?.status === "APPROVE") return "Esta orden ya fue pagada."
  if (order.status === "CANCELLED") return "Esta orden está cancelada."
  if (order.status !== "PENDING") return "Esta orden no se puede pagar."
  if (order.payment?.status === "PENDING") return "Ya hay un pago en proceso para esta orden."
  return null
}

/**
 * Obtiene el estado visible y las acciones permitidas para un pedido y su resultado de pago vigente.
 * Las acciones vuelven a comprobar el estado del pedido antes de modificarlo.
 * @param order Pedido que se desea consultar.
 * @param has_unsaved_result Indica si su resultado de pago todavía no se ha guardado; por defecto, false.
 * @returns Etiqueta del estado y disponibilidad de confirmación, procesamiento, pago y cancelación.
 */
export function get_order_availability(order: OrderDetails, has_unsaved_result = false): OrderAvailability {
  const is_confirmed = !has_unsaved_result && order.status === "CONFIRMED" && order.payment?.status === "APPROVE"
  const is_processing = !has_unsaved_result && order.status === "PENDING" && order.payment?.status === "PENDING"
  const can_pay = !has_unsaved_result && get_order_payment_block(order) === null
  const status_label = has_unsaved_result ? "Pendiente de guardar" : is_confirmed ? "Confirmado"
    : order.status === "CANCELLED" ? "Cancelado" : is_processing ? "Pago en proceso" : "Pendiente"
  return { status_label, is_confirmed, is_processing, can_pay, can_cancel: can_pay }
}

/**
 * Formatea la fecha de creación de un pedido con la configuración regional de Costa Rica.
 * Usa la zona horaria del navegador para mostrar la fecha y la hora.
 * @param created_at Fecha válida de creación del pedido.
 * @returns Fecha y hora legibles para la persona compradora.
 */
export function format_order_date(created_at: string): string {
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(created_at))
}

/**
 * Formatea la fecha de aceptación de los términos como DD/MM/AAAA.
 * Usa la zona horaria del navegador, igual que format_order_date().
 * @param accepted_at Fecha ISO válida de la aceptación.
 * @returns Fecha con día y mes de dos dígitos y año de cuatro dígitos.
 */
export function format_terms_acceptance_date(accepted_at: string): string {
  return new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(accepted_at))
}

/**
 * Crea un pago con estado PENDING por el total y la moneda de un pedido.
 * @param order Pedido que se desea pagar.
 * @returns Pago pendiente con un identificador y fecha nuevos.
 */
export function create_order_payment(order: OrderDetails): Payment {
  return {
    id: crypto.randomUUID(),
    order_id: order.id,
    created_at: new Date().toISOString(),
    amount: order.total,
    currency: order.currency,
    status: "PENDING",
  }
}

/**
 * Asigna un pago PENDING a un pedido y reemplaza el pago anterior rechazado o con error.
 * @param state Estado actual de los pedidos.
 * @param order_id Identificador del pedido.
 * @param payment Pago pendiente.
 * @returns Pedidos actualizados, o el mismo estado si el pedido no existe, no admite pagos o el pago no coincide con su total y moneda.
 */
export function start_order_payment(state: OrderDetails[], order_id: string, payment: Payment): OrderDetails[] {
  const order = state.find((current_order) => current_order.id === order_id)
  if (!order || get_order_payment_block(order) || payment.status !== "PENDING" || payment.order_id !== order_id ||
    payment.amount !== order.total || payment.currency !== order.currency) {
    return state
  }
  return state.map((current_order) =>
    current_order.id === order_id ? { ...current_order, payment } : current_order,
  )
}

/**
 * Registra el resultado del pago vigente de un pedido.
 * Cambia el pedido a CONFIRMED si el pago se aprueba; si se rechaza o falla, el pedido sigue en PENDING.
 * @param state Estado actual de los pedidos.
 * @param order_id Identificador del pedido.
 * @param payment_id Identificador del pago.
 * @param result Resultado del sandbox de pagos.
 * @returns Pedidos actualizados, o el mismo estado si el pedido no está PENDING o el pago ya no es el vigente o no está PENDING.
 */
export function complete_order_payment(state: OrderDetails[], order_id: string, payment_id: string, result: PaymentResult): OrderDetails[] {
  const order = state.find((current_order) => current_order.id === order_id)
  if (!order || order.status !== "PENDING" || !order.payment || order.payment.id !== payment_id || order.payment.status !== "PENDING") return state
  const payment: Payment = { ...order.payment, status: result.status }
  const status: OrderStatus = result.status === "APPROVE" ? "CONFIRMED" : order.status
  return state.map((current_order) =>
    current_order.id === order_id ? { ...current_order, status, payment } : current_order,
  )
}

/**
 * Cambia a ERROR los pagos de simulaciones locales interrumpidas por una recarga, sin ejecutarlos nuevamente.
 * Esta recuperación solo aplica al sandbox sin cobros reales; una pasarela real requiere verificar el resultado.
 * @param orders Pedidos recuperados.
 * @returns Pedidos con los pagos interrumpidos en ERROR, o el mismo arreglo si no había pagos pendientes.
 */
export function recover_interrupted_payments(orders: OrderDetails[]): OrderDetails[] {
  if (!orders.some((order) => order.payment?.status === "PENDING")) return orders
  return orders.map((order) => {
    if (order.payment?.status !== "PENDING") return order
    const payment: Payment = { ...order.payment, status: "ERROR" }
    return { ...order, payment }
  })
}
