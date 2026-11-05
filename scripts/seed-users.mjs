import "dotenv/config"
import { algoliasearch } from "algoliasearch"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

const app_id = process.env.VITE_ALGOLIA_APPLICATION_ID
const admin_api_key = process.env.VITE_ALGOLIA_ADMIN_API_KEY
if (!app_id) console.error("Variable de entorno faltante: VITE_ALGOLIA_APPLICATION_ID")
if (!admin_api_key) console.error("Variable de entorno faltante: VITE_ALGOLIA_ADMIN_API_KEY")

const index_name = process.env.VITE_ALGOLIA_USERS_INDEX
const client = algoliasearch(app_id, admin_api_key);

/**
 * Calcula el hash SHA-256 de una contraseña en formato hexadecimal.
 * Debe coincidir con el hash que calcula el inicio de sesión mediante crypto.subtle.
 * @param {string} password Contraseña en texto plano.
 * @returns {string} Hash SHA-256 en hexadecimal.
 */
function hash_password(password) {
  return createHash("sha256").update(password, "utf8").digest("hex")
}

/**
 * Lee y parsea el archivo JSON con los usuarios a indexar.
 * Por cada usuario reemplaza password por password_hash, de modo que la contraseña nunca llega al índice.
 * @returns {Promise<UserRecord[]>} Arreglo de usuarios
 * @throws {Error} Si el archivo no contiene un array válido.
 */
async function get_users() {
  const content = await readFile("data/users.json", "utf-8")
  const users = JSON.parse(content)
  if (!Array.isArray(users)) {
    throw new Error("El JSON debe ser un array de objetos")
  }
  return users.map(({ password, ...user }) => ({
    ...user,
    password_hash: hash_password(password),
  }));
}

/**
 * Obtiene los usuarios de get_users() y los sube al índice de Algolia definido en index_name.
 * @returns {Promise<void>}
 */
async function seed_users() {
  const users = await get_users();
  await client.saveObjects({
    indexName: index_name,
    objects: users,
  })
}

/**
 * Ejecuta el seed y maneja errores
 */
seed_users().catch((error) => {
  console.error("Error al poblar el índice de usuarios:", error);
  process.exit(1);
});
