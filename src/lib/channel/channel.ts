import type { User } from "@/lib/auth/types"
import type { SalesChannel } from "@/lib/channel/types"
import { get_user_storage_key } from "@/lib/shared/utils"

const channel_storage_key = "space-shop-channel"
const default_channel: SalesChannel = "b2c"

/**
 * Obtiene el canal de venta que corresponde al rol del usuario.
 * @param user Usuario con sesión iniciada, o null para un invitado.
 * @returns "b2b" para clientes empresariales; "b2c" para invitados, clientes B2C y ADMIN.
 */
export function get_sales_channel(user: Pick<User, "role"> | null): SalesChannel {
  return user?.role === "B2B" ? "b2b" : default_channel
}

/**
 * Comprueba si el usuario puede elegir el canal cuyo catálogo consulta.
 * @param user Usuario con sesión iniciada, o null para un invitado.
 * @returns true solo para el ADMIN, que consulta ambos catálogos sin comprar.
 */
export function can_change_channel(user: Pick<User, "role"> | null): boolean {
  return user?.role === "ADMIN"
}

/**
 * Valida un canal leído de una fuente no confiable, como localStorage.
 * @param value Valor que se desea comprobar.
 * @returns El canal recibido si es válido; "b2c" en cualquier otro caso.
 */
export function parse_sales_channel(value: unknown): SalesChannel {
  return value === "b2c" || value === "b2b" ? value : default_channel
}

/**
 * Recupera el último canal elegido por un usuario que puede cambiarlo.
 * @param user_id Identificador del usuario propietario de la elección.
 * @returns Canal guardado, o "b2c" si no existe, es inválido o falla la lectura.
 */
export function get_stored_channel(user_id: string): SalesChannel {
  try {
    return parse_sales_channel(window.localStorage.getItem(get_user_storage_key(channel_storage_key, user_id)))
  } catch {
    return default_channel
  }
}

/**
 * Guarda el canal elegido por un usuario.
 * @param user_id Identificador del usuario propietario de la elección.
 * @param channel Canal elegido.
 * @returns true si se guardó; false si falló el almacenamiento.
 */
export function save_channel(user_id: string, channel: SalesChannel): boolean {
  try {
    window.localStorage.setItem(get_user_storage_key(channel_storage_key, user_id), channel)
    return true
  } catch {
    return false
  }
}
