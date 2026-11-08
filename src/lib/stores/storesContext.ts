import { createContext, useContext } from "react"
import type { StoresContextValue } from "@/lib/stores/types"

const StoresContext = createContext<StoresContextValue | undefined>(undefined)
export default StoresContext

/**
 * Obtiene la selección de tienda, sus acciones y los avisos del carrito.
 * @returns Valor compartido por StoresProvider.
 * @throws Si se utiliza fuera de StoresProvider.
 */
export function useStores(): StoresContextValue {
  const stores = useContext(StoresContext)
  if (!stores) throw new Error("useStores debe utilizarse dentro de StoresProvider")
  return stores
}
