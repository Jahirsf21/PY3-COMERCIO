import type { OrderCustomer, OrderStatus } from "@/lib/orders/types"
import type { PaymentStatus } from "@/lib/payments/types"

export const order_customer_labels: Record<OrderCustomer["role"], string> = {
  B2C: "B2C",
  B2B: "B2B",
  GUEST: "Invitado",
}

export const order_status_labels: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
}

export const payment_status_labels: Record<PaymentStatus, string> = {
  PENDING: "En proceso",
  APPROVE: "Aprobado",
  DECLINED: "Rechazado",
  ERROR: "Con error",
}
