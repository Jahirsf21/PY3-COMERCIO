import type { CartItem, CartValidationResult } from "@/lib/cart/types"

/** Sucursal física con su identificador y provincia. */
export type Store = {
  id: string
  province: string
  locale_name: string
}

/** Sucursales agrupadas por provincia. */
export type StoreGroup = { province: string; stores: Store[] }

/** Datos de una línea del carrito necesarios para consultar el stock por sede. */
export type StoreCartProduct = Pick<CartItem, "id" | "product_id" | "sku" | "selected_size" | "quantity">

/** Estado de una línea del carrito en una sede. */
export type StoreCartLineStatus = "available" | "reduced" | "unavailable" | "unknown"

/** Estado, stock y cantidad solicitada de una línea en una sede. */
export type StoreCartLineAvailability = {
  item_id: string
  status: StoreCartLineStatus
  available_quantity: number | null
  quantity: number
}

/** Disponibilidad del carrito en una sede. */
export type StoreCartAvailability = {
  store: Store
  lines: StoreCartLineAvailability[]
  available_count: number
  reduced_count: number
  unavailable_count: number
  unknown_count: number
  available_units: number
}

/** Ajuste o retiro de una línea del carrito al seleccionar una sede. */
export type StoreCartChange = {
  item_id: string
  title: string
  image: CartItem["image"]
  selected_size: string
  previous_quantity: number
  quantity: number
  reason: string
}

/** Aviso con los cambios del carrito y la sede asociada. */
export type StoreCartNotice = { store: Store | null; changes: StoreCartChange[] }

/** Validaciones, líneas retiradas y ajustes tras comprobar la disponibilidad. */
export type StoreCartReconciliation = {
  validations: CartValidationResult[]
  removed_item_ids: string[]
  changes: StoreCartChange[]
}

/** Sede activa y acciones para seleccionarla y gestionar avisos del carrito. */
export type StoresContextValue = {
  selected_store: Store | null
  get_selected_store: () => Store | null
  select_store: (store_id: string | null) => void
  cart_notice: StoreCartNotice | null
  report_cart_changes: (store: Store | null, changes: StoreCartChange[]) => void
  dismiss_cart_notice: () => void
}
