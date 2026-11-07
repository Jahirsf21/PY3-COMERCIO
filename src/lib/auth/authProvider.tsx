import { useState } from "react"
import type { ReactNode } from "react"
import type { AuthContextValue, LoginCredentials, LoginResult } from "@/lib/auth/types"
import { authenticate_user, get_stored_session, save_session } from "@/lib/auth/auth"
import { record_analytics_event } from "@/lib/analytics/analytics"
import AuthContext from "@/lib/auth/authContext"

/**
 * Comparte la sesión simulada y la guarda en localStorage.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que consumen la sesión.
 * @returns Proveedor del usuario activo y de las acciones de inicio y cierre de sesión.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, set_user] = useState(get_stored_session)
  const [storage_error, set_storage_error] = useState(false)

  /**
   * Comprueba las credenciales contra el índice de usuarios e inicia la sesión si son válidas.
   * Registra el evento de inicio de sesión en los eventos del usuario antes de activarlo.
   * @param credentials Usuario y contraseña ingresados.
   * @returns Promesa con el resultado del inicio de sesión.
   */
  async function login(credentials: LoginCredentials): Promise<LoginResult> {
    const result = await authenticate_user(credentials)
    if (result.status === "success") {
      record_analytics_event(result.user.id, "login", { user_id: result.user.id, role: result.user.role })
      set_storage_error(!save_session(result.user))
      set_user(result.user)
    }
    return result
  }

  /**
   * Cierra la sesión: elimina la sesión guardada y deja la tienda sin usuario activo.
   * El carrito y el borrador de checkout del usuario quedan guardados con su clave y no se muestran a otro usuario.
   * @returns No retorna ningún valor.
   */
  function logout(): void {
    set_storage_error(!save_session(null))
    set_user(null)
  }

  const value: AuthContextValue = { user, storage_error, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
