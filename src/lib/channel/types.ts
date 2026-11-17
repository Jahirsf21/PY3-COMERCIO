/**
 * Canales de venta disponibles. Cada canal tiene sus propios índices de productos.
 */
export type SalesChannel = "b2c" | "b2b"

/**
 * Canal de venta activo y operaciones expuestas por el contexto de canal.
 * channel: canal cuyo catálogo se consulta.
 * can_change_channel: true si el usuario activo puede elegir el canal (solo ADMIN).
 * storage_error: true si no se pudo guardar la última elección del canal.
 * get_channel: obtiene el canal vigente, incluso durante una operación asíncrona.
 * set_channel: cambia el canal; no hace nada si el usuario no puede elegirlo.
 */
export type ChannelContextValue = {
  channel: SalesChannel
  can_change_channel: boolean
  storage_error: boolean
  get_channel: () => SalesChannel
  set_channel: (channel: SalesChannel) => void
}
