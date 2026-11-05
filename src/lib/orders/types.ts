import type { ProductImage } from "@/lib/catalog/types"
import type { CartItem, CartValidationResult } from "@/lib/cart/types"
import type { BuyerInfo, CheckoutFormData, DeliveryInfo, DeliveryMethod, TermsAcceptance } from "@/lib/checkout/types"
import type { CardPaymentData, Payment } from "@/lib/payments/types"
import type { Store } from "@/lib/stores/types"

/**
 * Estados disponibles para un pedido
 */
export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED"

/**
 * Producto de un pedido con su talla, cantidad, precio y subtotal
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
 */
export type Order = {
  id: string
  order_number: number
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

export type PrepareOrderInput = CheckoutFormData & {
  cart: CartItem[]
  store: Store | null
}

export type PreparedOrderItem = Omit<OrderItem, "id" | "order_id">

/** Datos verificados de una única sede, todavía sin identificadores ni pago. */
export type PreparedOrder = Pick<Order, "buyer" | "store" | "delivery_method" | "delivery" | "currency" | "subtotal" | "tax" | "shipping" | "total" | "termsAcceptance"> & {
  items: PreparedOrderItem[]
}

export type PrepareOrderResult =
  | { status: "ready"; order: PreparedOrder }
  | { status: "review"; message: string; validations: CartValidationResult[] }
  | { status: "rejected" | "error"; message: string }

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
  unsaved_order_ids: string[]
  retry_save_orders: () => boolean
  get_order: (order_id: string) => OrderDetails | undefined
  create_order: (prepared_order: PreparedOrder) => OrderDetails | null
  cancel_order: (order_id: string) => boolean
  pay_order: (order_id: string, card_data: CardPaymentData) => Promise<PayOrderResult>
}
