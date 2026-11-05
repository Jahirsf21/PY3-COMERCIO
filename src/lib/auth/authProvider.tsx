import { useState } from "react"
import type { ReactNode } from "react"
import type { AuthContextValue, LoginCredentials, LoginResult } from "@/lib/auth/types"
import { authenticate_user, get_stored_session, save_session } from "@/lib/auth/auth"
import AuthContext from "@/lib/auth/authContext"

/**
 * Comparte la sesión simulada y la guarda en localStorage.
 * @param props Propiedades del proveedor.
 * @param props.children Componentes que consumen la sesión.
 * @returns Proveedor del usuario activo y de la acción de inicio de sesión.
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

  const value: AuthContextValue = { user, storage_error, login }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
