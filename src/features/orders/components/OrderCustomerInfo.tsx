import type { OrderDetails } from "@/lib/orders/types"

type OrderCustomerInfoProps = {
  order: OrderDetails
}

export function OrderCustomerInfo({ order }: OrderCustomerInfoProps) {
  const customer_details = [
    { label: "Nombre completo", value: order.buyer.full_name },
    { label: "Tipo de identificación", value: order.buyer.identification_type },
    { label: "Número de identificación", value: order.buyer.identification_number },
    { label: "Correo electrónico", value: order.buyer.email },
    { label: "Teléfono", value: order.buyer.phone_number },
    { label: "Correo alternativo", value: order.buyer.alternative_email },
    { label: "Teléfono alternativo", value: order.buyer.alternative_phone_number },
  ].filter((detail) => detail.value?.trim())
  const delivery = order.delivery
  const delivery_details = delivery ? [
    { label: "País", value: delivery.country },
    { label: "Provincia", value: delivery.province },
    { label: "Cantón", value: delivery.canton },
    { label: "Distrito", value: delivery.district },
    { label: "Código postal", value: delivery.postal_code },
  ] : []

  return (
    <section aria-labelledby="payment-customer-title" className="min-w-0 rounded-xl border border-input bg-card p-5 sm:p-6">
      <h2 id="payment-customer-title" className="text-lg font-semibold">Información del cliente</h2>
      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {customer_details.map((detail) => (
          <div key={detail.label} className="min-w-0">
            <dt className="text-sm text-muted-foreground">{detail.label}</dt>
            <dd className="mt-1 break-words text-sm font-medium">{detail.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 border-t border-input pt-5">
        <h3 className="font-semibold">{order.delivery_method === "PICKUP" ? "Información de retiro" : "Información de entrega"}</h3>
        <p className="mt-2 text-sm font-medium">{order.store.locale_name} · {order.store.province}</p>
        {delivery && <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {delivery_details.map((detail) => (
            <div key={detail.label} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{detail.label}</dt>
              <dd className="mt-1 break-words text-sm font-medium">{detail.value}</dd>
            </div>
          ))}
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Dirección exacta</dt>
            <dd className="mt-1 break-words text-sm font-medium">{delivery.address}</dd>
          </div>
          {delivery.additional_information.trim() && (
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Indicaciones adicionales</dt>
              <dd className="mt-1 break-words text-sm font-medium">{delivery.additional_information}</dd>
            </div>
          )}
        </dl>}
      </div>
    </section>
  )
}
