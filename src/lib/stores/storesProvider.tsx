import { useCallback, useRef, useState } from "react"
import type { ReactNode } from "react"
import StoresContext from "@/lib/stores/storesContext"
import { get_store, get_stored_store, save_store } from "@/lib/stores/stores"
import type { Store, StoreCartChange, StoreCartNotice, StoresContextValue } from "@/lib/stores/types"

/**
 * Comparte la tienda elegida y mantiene los avisos de ajustes del carrito al cambiar de página.
 * Guarda la selección de tienda por separado de los pedidos y del carrito.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que consumen la tienda y los avisos.
 * @returns Proveedor de la selección de tienda y sus acciones.
 */
export function StoresProvider({ children }: { children: ReactNode }) {
  const [selected_store, set_selected_store] = useState(get_stored_store)
  const current_store = useRef(selected_store)
  const [notices, set_notices] = useState<StoreCartNotice[]>([])
  /**
   * Obtiene la selección vigente para comprobar operaciones asíncronas.
   * @returns Tienda seleccionada, o null si no hay selección.
   */
  const get_selected_store = useCallback(() => current_store.current, [])
  /**
   * Selecciona un local registrado y conserva su identificador en localStorage.
   * Ignora identificadores desconocidos y selecciones que no cambian el local actual.
   * @param store_id Identificador del local, o null para retirar la selección.
   * @returns No retorna ningún valor.
   */
  const select_store = useCallback((store_id: string | null): void => {
    const store = get_store(store_id)
    if ((store_id !== null && !store) || current_store.current === store) return
    current_store.current = store
    set_selected_store(store)
    save_store(store)
  }, [])
  /**
   * Agrega un aviso de ajustes ya aplicados al carrito sin reemplazar los avisos pendientes.
   * @param store Tienda usada para la comprobación, o null si aún no había selección.
   * @param changes Reducciones y eliminaciones que se deben informar.
   * @returns No retorna ningún valor.
   */
  const report_cart_changes = useCallback((store: Store | null, changes: StoreCartChange[]): void => {
    if (changes.length > 0) set_notices((previous) => [...previous, { store, changes }])
  }, [])
  const value: StoresContextValue = {
    selected_store,
    get_selected_store,
    select_store,
    cart_notice: notices[0] ?? null,
    report_cart_changes,
    /**
     * Cierra el aviso actual y permite mostrar el siguiente, si existe.
     * @returns No retorna ningún valor.
     */
    dismiss_cart_notice: () => set_notices((previous) => previous.slice(1)),
  }
  return <StoresContext.Provider value={value}>{children}</StoresContext.Provider>
}
