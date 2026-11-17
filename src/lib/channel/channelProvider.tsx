import { useCallback, useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useAuth } from "@/lib/auth/authContext"
import { can_change_channel, get_sales_channel, get_stored_channel, parse_sales_channel, save_channel } from "@/lib/channel/channel"
import ChannelContext from "@/lib/channel/channelContext"
import type { ChannelContextValue, SalesChannel } from "@/lib/channel/types"

/**
 * Comparte el canal de venta cuyo catálogo consulta la aplicación.
 * Para invitados y clientes el canal depende del rol y no se puede cambiar.
 * El ADMIN elige el canal; su elección se guarda por usuario y se recupera al iniciar sesión.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que consumen el canal activo.
 * @returns Proveedor del canal activo y la acción para cambiarlo.
 */
export function ChannelProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const user_id = user?.id ?? null
  const can_change = can_change_channel(user)
  const role_channel = get_sales_channel(user)
  const [selection, set_selection] = useState(() => ({ user_id, channel: can_change && user_id ? get_stored_channel(user_id) : role_channel }))
  const [storage_error, set_storage_error] = useState(false)

  if (selection.user_id !== user_id) {
    set_selection({ user_id, channel: can_change && user_id ? get_stored_channel(user_id) : role_channel })
    set_storage_error(false)
  }

  const channel = can_change && selection.user_id === user_id ? selection.channel : role_channel
  const current_channel = useRef(channel)
  useLayoutEffect(() => { current_channel.current = channel }, [channel])

  /**
   * Obtiene la referencia vigente del canal, incluso durante una operación asíncrona.
   * @returns Canal activo en memoria.
   */
  const get_channel = useCallback(() => current_channel.current, [])

  /**
   * Cambia el canal consultado y guarda la elección del usuario.
   * @param next_channel Canal que se desea consultar.
   * @returns No retorna ningún valor; no hace nada si el usuario no puede elegir el canal.
   */
  const set_channel = useCallback((next_channel: SalesChannel): void => {
    if (!can_change || !user_id) return
    const parsed_channel = parse_sales_channel(next_channel)
    set_selection({ user_id, channel: parsed_channel })
    set_storage_error(!save_channel(user_id, parsed_channel))
  }, [can_change, user_id])

  const value: ChannelContextValue = { channel, can_change_channel: can_change, storage_error, get_channel, set_channel }

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
}
