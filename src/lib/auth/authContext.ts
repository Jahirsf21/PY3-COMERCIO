import { createContext, useContext } from "react"
import type { AuthContextValue } from "@/lib/auth/types"

/**
 * Contexto que comparte la sesión y las acciones de autenticación.
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export default AuthContext

/**
 * Obtiene la sesión y las acciones de autenticación.
 * @returns Valor del contexto de autenticación.
 * @throws Si se usa fuera de AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const auth_context = useContext(AuthContext)
  if (!auth_context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider")
  }
  return auth_context
}
