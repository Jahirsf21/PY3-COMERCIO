/** Rutas de la aplicación; los componentes las usan en vez de escribir cadenas. */
export const routes = {
  catalog: "/",
  login: "/login",
  product: "/product/:productId",
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  order: "/orders/:orderId",
  order_payment: "/orders/:orderId/payment",
  analytics: "/analytics",
  policies: "/policies",
  admin: "/admin",
  admin_orders: "/admin/orders",
  admin_order: "/admin/orders/:orderId",
  admin_products: "/admin/products",
  admin_analytics: "/admin/analytics",
} as const

/**
 * Arma la ruta del detalle de un producto.
 * @param product_id Identificador del producto.
 * @param params Parámetros de búsqueda opcionales (variante, talla).
 * @returns Ruta con el identificador codificado.
 */
export function product_path(product_id: string, params?: Record<string, string>): string {
  const query = params ? `?${new URLSearchParams(params)}` : ""
  return `/product/${encodeURIComponent(product_id)}${query}`
}

/**
 * Arma la ruta del detalle de un pedido.
 * @param order_id Identificador del pedido.
 * @returns Ruta con el identificador codificado.
 */
export function order_path(order_id: string): string {
  return `/orders/${encodeURIComponent(order_id)}`
}

/**
 * Arma la ruta del pago de un pedido.
 * @param order_id Identificador del pedido.
 * @returns Ruta con el identificador codificado.
 */
export function order_payment_path(order_id: string): string {
  return `${order_path(order_id)}/payment`
}

/**
 * Arma la ruta del detalle de una orden en el panel ADMIN.
 * @param order_id Identificador de la orden.
 * @returns Ruta con el identificador codificado.
 */
export function admin_order_path(order_id: string): string {
  return `/admin/orders/${encodeURIComponent(order_id)}`
}

/**
 * Arma la ruta de una sección de Políticas y Ayuda.
 * @param section_id Ancla de la sección, en español.
 * @returns Ruta con el ancla.
 */
export function policy_path(section_id: string): string {
  return `${routes.policies}#${section_id}`
}

/**
 * Arma la URL absoluta de la tienda para abrirla en otra pestaña.
 * @returns URL con la base de Vite y el HashRouter.
 */
export function store_url(): string {
  return `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}#${routes.catalog}`
}
