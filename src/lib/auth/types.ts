/**
 * Roles con acceso a la tienda.
 */
export type UserRole = "B2C" | "B2B" | "ADMIN"

/**
 * Empresa asociada a un usuario B2B.
 */
export type Company = {
  name: string
  legal_id: string
}

/**
 * Registro de usuario recibido del índice de usuarios de Algolia
 */
export type UserRecord = {
  objectID: string
  username: string
  password_hash: string
  full_name: string
  role: string
  company?: Company
}

/**
 * Usuario con sesión iniciada
 */
export type User = {
  id: string
  username: string
  full_name: string
  role: UserRole
  company: Company | null
}

/**
 * Credenciales ingresadas en el formulario de inicio de sesión.
 */
export type LoginCredentials = {
  username: string
  password: string
}

/**
 * Resultado de comprobar las credenciales contra el índice de usuarios.
 * success: las credenciales y el rol son válidos.
 * invalid_credentials: el usuario no existe o la contraseña no coincide.
 * invalid_role: las credenciales son correctas, pero el usuario no tiene un rol válido.
 * invalid_account: el registro del usuario tiene datos incorrectos o incompletos, como un B2B sin empresa válida.
 * error: no se pudo consultar el índice de usuarios.
 */
export type LoginResult =
  | {
    status: "success"
    user: User
  }
  | {
    status: "invalid_credentials" | "invalid_role" | "invalid_account" | "error"
    message: string
  }

/**
 * Estado y operaciones expuestas por el contexto de autenticación
 */
export type AuthContextValue = {
  user: User | null
  storage_error: boolean
  login: (credentials: LoginCredentials) => Promise<LoginResult>
  logout: () => void
}
