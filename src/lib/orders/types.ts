import type { AccountIdentity, Company } from "@/lib/auth/types"
import type { SalesChannel } from "@/lib/channel/types"
import type { ProductImage } from "@/lib/catalog/types"
import type { CartItem, CartQuantityConditions, CartValidationResult } from "@/lib/cart/types"
import type { BuyerInfo, CheckoutFormData, DeliveryInfo, DeliveryMethod, TermsAcceptance } from "@/lib/checkout/types"
import type { CardPaymentData, Payment, PaymentStatus } from "@/lib/payments/types"
import type { Store } from "@/lib/stores/types"

/**
 * Estados disponibles para un pedido
 */
export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED"

/** Propietario y contexto comercial del pedido al momento de la compra. */
export type OrderCustomer = {
  user_id: string
  role: "B2C" | "B2B" | "GUEST"
  channel: SalesChannel
  company: Company | null
}

/**
 * Línea de un pedido con el precio, las condiciones y el stock verificados.
 */
export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  sku: string
  selected_size: string
  title: string
  image: ProductImage
  unit_price: number
  quantity: number
  subtotal: number
  conditions: CartQuantityConditions
  available_quantity: number
}

/**
 * Productos de una página del pedido y datos de su paginación.
 */
export type OrderPagination = {
  page_items: OrderItem[]
  current_page: number
  total_pages: number
  total_products: number
}

/**
 * Datos del pedido, comprador, entrega y montos de la compra.
 * tax es el monto del IVA y shipping el costo de envío.
 * termsAcceptance registra la aceptación de los Términos y Condiciones; todo pedido debe tenerla.
 * order_number es la referencia global que se muestra al cliente.
 */
export type Order = OrderCustomer & {
  id: string
  order_number: string
  created_at: string
  buyer: BuyerInfo
  store: Store
  delivery_method: DeliveryMethod
  delivery: DeliveryInfo | null
  currency: string
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: OrderStatus
  termsAcceptance: TermsAcceptance
}

/**
 * Pedido con los productos comprados y su pago.
 * payment es null si todavía no existe un intento de pago.
 */
export type OrderDetails = Order & {
  items: OrderItem[]
  payment: Payment | null
}

/** Registro de Algolia con líneas y pago vinculados por el objectID. */
export type OrderIndexRecord = Omit<OrderDetails, "id" | "items" | "payment"> & {
  objectID: string
  created_at_timestamp: number
  items: Omit<OrderItem, "order_id">[]
  payment: Omit<Payment, "order_id"> | null
}

/** Parámetros de búsqueda de órdenes. */
export type AdminOrderSearchInput = {
  query?: string
  role?: OrderCustomer["role"]
  store_id?: Store["id"]
  status?: OrderStatus
  payment_status?: PaymentStatus
  page?: number
}

/** Resumen de una orden para el panel. */
export type AdminOrderSummary = Pick<Order, "id" | "order_number" | "created_at" | "user_id" | "role" | "store" | "total" | "currency" | "status"> & {
  account: AccountIdentity | null
  recipient_name: string
  company_name: string | null
  payment_status: PaymentStatus | null
  first_item_image: ProductImage | null
  items_count: number
}

/** Resumen de las órdenes de la tienda para las tarjetas del panel. */
export type AdminOrderStats = {
  total_orders: number
  paid_orders: number
  pending_orders: number
  paid_totals: { currency: string; amount: number }[]
  is_partial: boolean
}

/** Orden con la cuenta que la realizó. */
export type AdminOrderDetail = OrderDetails & { account: AccountIdentity | null }

/** Resultados paginados de la búsqueda. */
export type AdminOrderSearchResult = {
  orders: AdminOrderSummary[]
  current_page: number
  total_pages: number
  total_orders: number
}

/** Copia local y pedidos que aún deben publicarse. */
export type StoredOrders = {
  orders: OrderDetails[]
  pending_order_ids: string[]
}

/** Estado de sesión con los pagos que todavía no se pudieron guardar. */
export type LocalOrders = StoredOrders & {
  unsaved_order_ids: string[]
}

/** Estado de la consulta de pedidos en Algolia. */
export type OrdersReadStatus = "loading" | "ready" | "error"

/** Formulario de checkout con el carrito, el canal de venta del comprador y la tienda elegida. */
export type PrepareOrderInput = CheckoutFormData & {
  cart: CartItem[]
  channel: SalesChannel
  store: Store | null
}

/** Línea verificada antes de asignarle un identificador y asociarla al pedido. */
export type PreparedOrderItem = Omit<OrderItem, "id" | "order_id">

/** Datos verificados de una única sede, todavía sin identificadores ni pago. */
export type PreparedOrder = Pick<Order, "buyer" | "channel" | "store" | "delivery_method" | "delivery" | "currency" | "subtotal" | "tax" | "shipping" | "total" | "termsAcceptance"> & {
  items: PreparedOrderItem[]
}

/** Resultado de validar los datos de compra antes de crear el pedido. */
export type PrepareOrderResult =
  | { status: "ready"; order: PreparedOrder }
  | { status: "review"; message: string; validations: CartValidationResult[] }
  | { status: "rejected" | "error"; message: string }

/** Pedido guardado localmente o motivo por el que no se pudo crear. */
export type CreateOrderResult =
  | { status: "created"; order: OrderDetails }
  | { status: "rejected"; message: string }

/**
 * Estado visible y acciones permitidas para consultar un pedido.
 * Un resultado sin guardar no se presenta como compra confirmada ni permite pagar o cancelar.
 */
export type OrderAvailability = {
  status_label: string
  is_confirmed: boolean
  is_processing: boolean
  can_pay: boolean
  can_cancel: boolean
}

/**
 * Resultado de pagar un pedido.
 * processed: el resultado final del sandbox se guardó correctamente.
 * unsaved: el resultado final permanece en memoria y debe guardarse antes de continuar.
 * rejected: el pago no se inició o su respuesta ya no corresponde al pago vigente del pedido.
 */
export type PayOrderResult =
  | {
    status: "processed" | "unsaved"
    payment: Payment
    message: string
  }
  | {
    status: "rejected"
    message: string
  }

/**
 * Estado y operaciones expuestas por el contexto de pedidos
 */
export type OrdersContextValue = {
  orders: OrderDetails[]
  storage_error: boolean
  orders_read_status: OrdersReadStatus
  has_pending_order_sync: boolean
  unsaved_order_ids: string[]
  retry_save_orders: () => boolean
  retry_order_sync: () => void
  get_order: (order_id: string) => OrderDetails | undefined
  create_order: (prepared_order: PreparedOrder) => CreateOrderResult
  cancel_order: (order_id: string) => boolean
  pay_order: (order_id: string, card_data: CardPaymentData) => Promise<PayOrderResult>
}
