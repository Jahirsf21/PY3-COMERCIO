import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { CartAction, CartContextValue, CartItem, CartItemValidation, CartProduct, CartQuantityLimits, CartValidationResult } from "@/lib/cart/types"
import { cart_reducer, create_cart_item, get_cart_add_quantity_limits, get_cart_item_id, get_cart_shipping_cost, get_cart_subtotal, get_cart_tax, get_cart_total, get_cart_total_units, get_cart_validation_error, get_stored_cart, is_valid_cart_quantity, parse_cart_data, save_cart } from "@/lib/cart/cart"
import { get_catalog_quantity_limits, get_cart_validation } from "@/lib/catalog/catalog"
import CartContext from "@/lib/cart/cartContext"
import { useStores } from "@/lib/stores/storesContext"
import { reconcile_store_cart } from "@/lib/stores/stores"

/**
 * Comparte el carrito, valida sus líneas con el catálogo y guarda cada modificación.
 * Ajusta cantidades al stock de la tienda y conserva los productos si falla la consulta.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que consumen el carrito.
 * @returns Proveedor del estado y las acciones del carrito.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { selected_store, get_selected_store, report_cart_changes } = useStores()
  const [cart, set_cart] = useState(get_stored_cart)
  const current_cart = useRef(cart)
  /**
   * Obtiene la referencia vigente del carrito, incluso durante una operación asíncrona.
   * @returns Líneas actuales en memoria, sin leer nuevamente localStorage.
   */
  const get_cart = useCallback(() => current_cart.current, [])
  const [validations, set_validations] = useState<CartValidationResult[]>([])
  const [validated_store_id, set_validated_store_id] = useState(selected_store?.id ?? null)
  const [validation_retry, set_validation_retry] = useState(0)
  const [pending_operations, set_pending_operations] = useState(0)
  const [storage_error, set_storage_error] = useState(false)
  const [notice, set_notice] = useState<string | null>(null)

  /**
   * Aplica una acción al carrito y guarda el resultado cuando su estado cambia.
   * @param action Acción validada que se desea aplicar.
   * @returns true si el carrito cambió; false si el reducer no aceptó cambios.
   */
  const apply_action = useCallback((action: CartAction): boolean => {
    const next_cart = cart_reducer(current_cart.current, action)
    if (next_cart === current_cart.current) return false
    current_cart.current = next_cart
    set_cart(next_cart)
    set_storage_error(!save_cart(next_cart))
    return true
  }, [])

  /**
   * Descarta las validaciones actuales y solicita otra consulta del catálogo.
   * @returns No retorna ningún valor.
   */
  const revalidate_cart = useCallback((): void => {
    set_validations([])
    set_validation_retry((retry) => retry + 1)
  }, [])

  useEffect(() => {
    if (cart.length === 0) return
    let active = true
    get_cart_validation(cart, selected_store)
      .then((results) => {
        if (!active || get_selected_store() !== selected_store) return
        const applicable = results.filter(({ original_item }) => current_cart.current.includes(original_item))
        const reconciliation = reconcile_store_cart(applicable)
        set_validations(reconciliation.validations)
        set_validated_store_id(selected_store?.id ?? null)
        apply_action({ type: "refresh", results: reconciliation.validations })
        for (const item_id of reconciliation.removed_item_ids) apply_action({ type: "remove", item_id })
        report_cart_changes(selected_store, reconciliation.changes)
        if (applicable.some(({ item, original_item }) => item.unit_price !== original_item.unit_price || item.currency !== original_item.currency)) {
          set_notice("Actualizamos los precios. Revisa tu carrito antes de continuar.")
        }
      })
      .catch(() => {
        if (active && get_selected_store() === selected_store) {
          set_validations(cart.map(get_cart_validation_error))
          set_validated_store_id(selected_store?.id ?? null)
        }
      })
    return () => { active = false }
  }, [cart, validation_retry, selected_store, get_selected_store, report_cart_changes, apply_action])

  /**
   * Agrega unidades respetando las reglas B2C y el stock actual de la tienda.
   * Descarta la operación si el carrito o la tienda cambian durante la consulta.
   * @param product Producto que se desea agregar.
   * @param selected_size Talla seleccionada.
   * @param quantity Unidades adicionales; por defecto, el mínimo permitido para agregar.
   * @returns Promesa con true si se agregó el producto; false si la solicitud no es válida o ya no está vigente.
   * @throws Si falla la consulta del catálogo; solicita revalidar el carrito antes de propagar el error.
   */
  async function add_to_cart(product: CartProduct, selected_size: string, quantity?: number): Promise<boolean> {
    if (quantity !== undefined && (!Number.isSafeInteger(quantity) || quantity < 1)) return false
    const original_cart = current_cart.current
    const store = get_selected_store()
    const item_id = get_cart_item_id(product.sku, selected_size)
    set_pending_operations((count) => count + 1)
    try {
      const limits = await get_catalog_quantity_limits(product.product_id, product.sku, selected_size, store)
      if (current_cart.current !== original_cart || get_selected_store() !== store) return false
      const cart_quantity = original_cart.find((item) => item.id === item_id)?.quantity ?? 0
      const additional_limits = get_cart_add_quantity_limits(limits, cart_quantity)
      const additional_quantity = quantity ?? additional_limits?.min_quantity ?? 0
      if (!limits || !is_valid_cart_quantity(additional_quantity, additional_limits)) {
        revalidate_cart()
        return false
      }
      const item = parse_cart_data([create_cart_item(product, selected_size, additional_quantity)])[0]
      return Boolean(item && apply_action({ type: "add", item, limits }))
    } catch (error) {
      revalidate_cart()
      throw error
    } finally {
      set_pending_operations((count) => count - 1)
    }
  }

  /**
   * Cambia la cantidad de una línea con límites recién consultados y descarta respuestas antiguas.
   * @param item_id Identificador de la línea que se desea modificar.
   * @param get_quantity Función que calcula la cantidad solicitada a partir de la línea y sus límites.
   * @returns Promesa con true si cambió la cantidad; false si la línea cambió, desapareció o la cantidad es inválida.
   * @throws Si falla la consulta del catálogo; solicita revalidar antes de propagar el error.
   */
  async function change_quantity(item_id: string, get_quantity: (item: CartItem, limits: CartQuantityLimits) => number): Promise<boolean> {
    const item = current_cart.current.find((item) => item.id === item_id)
    if (!item) return false
    const store = get_selected_store()
    set_pending_operations((count) => count + 1)
    try {
      const limits = await get_catalog_quantity_limits(item.product_id, item.sku, item.selected_size, store)
      if (current_cart.current.find((current_item) => current_item.id === item_id) !== item || get_selected_store() !== store) return false
      const changed = limits ? apply_action({ type: "set_quantity", item_id, quantity: get_quantity(item, limits), limits }) : false
      if (!changed) revalidate_cart()
      return changed
    } catch (error) {
      revalidate_cart()
      throw error
    } finally {
      set_pending_operations((count) => count - 1)
    }
  }

  const item_validation: Record<string, CartItemValidation> = Object.fromEntries(cart.map((item) => {
    const result = validated_store_id === (selected_store?.id ?? null) ? validations.find((validation) => validation.item === item) : undefined
    return [item.id, result ?? { status: "pending", limits: null }]
  }))
  const is_validating = pending_operations > 0 || Object.values(item_validation).some((result) => result.status === "pending")
  const can_checkout = cart.length > 0 && !is_validating && Object.values(item_validation).every((result) => result.status === "valid") &&
    new Set(cart.map((item) => item.currency)).size === 1
  const value: CartContextValue = {
    cart,
    get_cart,
    subtotal: get_cart_subtotal(cart),
    shipping: get_cart_shipping_cost(cart),
    tax: get_cart_tax(cart),
    total: get_cart_total(cart),
    total_items: get_cart_total_units(cart),
    item_validation,
    is_validating,
    can_checkout,
    storage_error,
    notice,
    revalidate_cart,
    /**
     * Cierra el aviso de precios sin modificar el carrito.
     * @returns No retorna ningún valor.
     */
    dismiss_notice: () => set_notice(null),
    add_to_cart,
    /**
     * Aumenta un paso la cantidad de la línea con el stock vigente.
     * @param item_id Identificador de la línea.
     * @returns Promesa que indica si se aceptó el incremento.
     * @throws Si falla la consulta del catálogo.
     */
    increment_item: (item_id) => change_quantity(item_id, (item, limits) => item.quantity + limits.step_quantity),
    /**
     * Reduce un paso la cantidad sin permitir valores inferiores al mínimo.
     * @param item_id Identificador de la línea.
     * @returns Promesa que indica si se aceptó la reducción.
     * @throws Si falla la consulta del catálogo.
     */
    decrement_item: (item_id) => change_quantity(item_id, (item, limits) => item.quantity - limits.step_quantity),
    /**
     * Elimina una línea completa y guarda el carrito resultante.
     * @param item_id Identificador de la línea que se desea eliminar.
     * @returns No retorna ningún valor.
     */
    remove_item: (item_id) => { apply_action({ type: "remove", item_id }) },
    /**
     * Vacía el carrito y elimina su clave de almacenamiento si el navegador lo permite.
     * @returns No retorna ningún valor.
     */
    clear_cart: () => { apply_action({ type: "clear" }) },
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
