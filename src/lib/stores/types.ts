import type { CartItem, CartValidationResult } from "@/lib/cart/types"

export type Store = {
  id: string
  province: string
  locale_name: string
}

export type StoreGroup = { province: string; stores: Store[] }
export type StoreCartProduct = Pick<CartItem, "product_id" | "sku" | "selected_size">

export type StoreCartChange = {
  item_id: string
  title: string
  image: CartItem["image"]
  selected_size: string
  previous_quantity: number
  quantity: number
}

export type StoreCartNotice = { store: Store | null; changes: StoreCartChange[] }
export type StoreCartReconciliation = {
  validations: CartValidationResult[]
  removed_item_ids: string[]
  changes: StoreCartChange[]
}

export type StoresContextValue = {
  selected_store: Store | null
  get_selected_store: () => Store | null
  select_store: (store_id: string | null) => void
  cart_notice: StoreCartNotice | null
  report_cart_changes: (store: Store | null, changes: StoreCartChange[]) => void
  dismiss_cart_notice: () => void
}
