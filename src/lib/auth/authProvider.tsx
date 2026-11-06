import { useState } from "react"
import type { ReactNode } from "react"
import type { AuthContextValue, LoginCredentials, LoginResult } from "@/lib/auth/types"
import { authenticate_user, get_stored_session, save_session } from "@/lib/auth/auth"
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
   * @param credentials Usuario y contraseña ingresados.
   * @returns Promesa con el resultado del inicio de sesión.
   */
  async function login(credentials: LoginCredentials): Promise<LoginResult> {
    const result = await authenticate_user(credentials)
    if (result.status === "success") {
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
