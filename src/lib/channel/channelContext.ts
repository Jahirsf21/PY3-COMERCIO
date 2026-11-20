import { createContext, useContext } from "react"
import type { ChannelContextValue } from "@/lib/channel/types"

/**
 * Contexto que comparte el canal de venta activo.
 */
const ChannelContext = createContext<ChannelContextValue | undefined>(undefined)

export default ChannelContext

/**
 * Obtiene el canal de venta activo y la acción para cambiarlo.
 * @returns Valor del contexto de canal.
 * @throws Si se usa fuera de ChannelProvider.
 */
export function useChannel(): ChannelContextValue {
  const channel_context = useContext(ChannelContext)
  if (!channel_context) {
    throw new Error("useChannel debe utilizarse dentro de ChannelProvider")
  }
  return channel_context
}
