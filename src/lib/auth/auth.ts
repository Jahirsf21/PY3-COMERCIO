import { algolia_indices, search_client } from "@/lib/algolia/algolia"
import type { Company, LoginCredentials, LoginResult, User, UserRecord, UserRole } from "@/lib/auth/types"
import { get_stored_json, is_nonempty_string, is_record } from "@/lib/shared/utils"

const user_roles: UserRole[] = ["B2C", "B2B", "ADMIN"]

/**
 * Comprueba si un valor corresponde a uno de los roles con acceso a la tienda.
 * @param value Valor que se desea comprobar.
 * @returns true si el valor es B2C, B2B o ADMIN.
 */
export function is_valid_role(value: unknown): value is UserRole {
  return typeof value === "string" && user_roles.includes(value as UserRole)
}

/**
 * Obtiene la etiqueta visible de un rol.
 * @param role Rol del usuario.
 * @returns Nombre del rol para mostrar en la interfaz.
 */
export function get_role_label(role: UserRole): string {
  if (role === "B2B") return "Persona Jurídica"
  if (role === "ADMIN") return "Administrador"
  return "Persona"
}

/**
 * Calcula el hash SHA-256 de una contraseña en formato hexadecimal.
 * Debe coincidir con el hash que genera scripts/seed-users.mjs.
 * @param password Contraseña en texto plano.
 * @returns Promesa con el hash SHA-256 en hexadecimal.
 */
export async function hash_password(password: string): Promise<string> {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Valida la empresa de un usuario.
 * @param value Valor recibido.
 * @returns Empresa con nombre y cédula jurídica, o null si no es válida.
 */
function parse_company(value: unknown): Company | null {
  if (!is_record(value) || !is_nonempty_string(value.name) || !is_nonempty_string(value.legal_id)) return null
  return { name: value.name, legal_id: value.legal_id }
}

/**
 * Convierte un registro del índice de usuarios en el usuario de la sesión, sin el hash de la contraseña.
 * Exige objectID, username y full_name como textos no vacíos y, para B2B, una empresa con nombre y cédula jurídica.
 * Para B2C y ADMIN ignora company aunque venga en el registro.
 * @param record Registro recibido de Algolia.
 * @param role Rol ya validado del registro.
 * @returns Usuario de la sesión, o null si el registro tiene algún dato incorrecto.
 */
function parse_user_record(record: Record<string, unknown>, role: UserRole): User | null {
  const { objectID, username, full_name } = record
  if (!is_nonempty_string(objectID) || !is_nonempty_string(username) || !is_nonempty_string(full_name)) return null
  const company = role === "B2B" ? parse_company(record.company) : null
  if (role === "B2B" && !company) return null
  return { id: objectID, username, full_name, role, company }
}

/**
 * Busca un usuario exacto por username en el índice de usuarios de Algolia, sin usar la caché del cliente.
 * Requiere username como atributo de faceta (filterOnly) en el índice.
 * @param username Usuario ingresado, sin espacios al inicio ni al final.
 * @returns Promesa con los registros encontrados sin validar; vacío si no existe el usuario.
 * @throws Si falla la consulta o la respuesta no contiene un arreglo de hits.
 */
async function find_user_records(username: string): Promise<UserRecord[]> {
  const username_filter_value = username.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  const { data: { results } } = await search_client.searchWithHTTPInfo<UserRecord>({
    requests: [{
      indexName: algolia_indices.users,
      query: "",
      filters: `username:"${username_filter_value}"`,
      hitsPerPage: 1,
    }],
  })
  const search_result = results[0]
  if (!search_result || !("hits" in search_result) || !Array.isArray(search_result.hits)) throw new Error("Respuesta de usuarios inválida.")
  return search_result.hits as UserRecord[]
}

/**
 * Valida que el formulario de inicio de sesión tenga usuario y contraseña.
 * @param credentials Credenciales ingresadas.
 * @returns Errores por campo; vacío si ambos campos tienen contenido.
 */
export function validate_login_credentials(credentials: LoginCredentials): Partial<Record<keyof LoginCredentials, string>> {
  const errors: Partial<Record<keyof LoginCredentials, string>> = {}
  if (credentials.username.trim() === "") errors.username = "Ingresa tu usuario."
  if (credentials.password === "") errors.password = "Ingresa tu contraseña."
  return errors
}

/**
 * Comprueba usuario y contraseña contra el índice de usuarios de Algolia.
 * Compara el hash SHA-256 de la contraseña con password_hash, y valida el rol y el resto del registro
 * solo si las credenciales son correctas, para no revelar datos de una cuenta a quien no conoce su contraseña.
 * Un registro con datos incorrectos no permite ingresar.
 * @param credentials Usuario y contraseña ingresados.
 * @returns Promesa con el usuario de la sesión, o el motivo por el que no puede ingresar.
 */
export async function authenticate_user(credentials: LoginCredentials): Promise<LoginResult> {
  const username = credentials.username.trim()
  if (username === "" || credentials.password === "") {
    return { status: "invalid_credentials", message: "Ingresa tu usuario y tu contraseña." }
  }
  const invalid_account: LoginResult = {
    status: "invalid_account",
    message: "Los datos de tu cuenta están incompletos o son incorrectos. Comunícate con el administrador.",
  }
  try {
    const [record] = await find_user_records(username)
    if (!record) return { status: "invalid_credentials", message: "El usuario o la contraseña no son correctos." }
    if (!is_record(record) || !is_nonempty_string(record.password_hash)) return invalid_account
    if (record.password_hash !== await hash_password(credentials.password)) {
      return { status: "invalid_credentials", message: "El usuario o la contraseña no son correctos." }
    }
    if (!is_valid_role(record.role)) {
      return { status: "invalid_role", message: "Tu usuario no tiene un rol válido para ingresar a la tienda. Comunícate con el administrador." }
    }
    const user = parse_user_record(record, record.role)
    return user ? { status: "success", user } : invalid_account
  } catch {
    return { status: "error", message: "No pudimos verificar tus datos. Revisa tu conexión e intenta nuevamente." }
  }
}

/**
 * Valida el usuario de una sesión guardada.
 * @param value Contenido guardado en localStorage.
 * @returns Usuario de la sesión, o null si falta algún dato, el rol no es válido o un usuario B2B no tiene empresa válida.
 */
export function parse_session_user(value: unknown): User | null {
  if (!is_record(value)) return null
  const { id, username, full_name, role } = value
  if (!is_nonempty_string(id) || !is_nonempty_string(username) || !is_nonempty_string(full_name) || !is_valid_role(role)) return null
  const company = role === "B2B" ? parse_company(value.company) : null
  if (role === "B2B" && !company) return null
  return { id, username, full_name, role, company }
}

/**
 * Obtiene la sesión guardada en localStorage y la valida mediante parse_session_user().
 * @returns Usuario de la sesión, o null si no hay una sesión válida o falla la lectura.
 */
export function get_stored_session(): User | null {
  return parse_session_user(get_stored_json("space-shop-session"))
}

/**
 * Guarda el usuario de la sesión en localStorage, o elimina la clave si no hay sesión.
 * @param user Usuario con sesión iniciada, o null para eliminar la sesión guardada.
 * @returns true si se guardó; false si el navegador rechaza la operación.
 */
export function save_session(user: User | null): boolean {
  try {
    if (user) window.localStorage.setItem("space-shop-session", JSON.stringify(user))
    else window.localStorage.removeItem("space-shop-session")
    return true
  } catch {
    return false
  }
}
