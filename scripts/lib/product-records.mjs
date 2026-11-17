import "dotenv/config"
import { algoliasearch } from "algoliasearch"
import { readFile } from "node:fs/promises"

/**
 * Conserva únicamente el stock original por talla y local, sin reservas ni totales agregados.
 * @param {Array} stock_by_location Locales con stock por talla.
 * @returns {StockByLocation[]} Locales con stock_quantity por talla.
 */
function process_stock_by_location(stock_by_location) {
  if (!Array.isArray(stock_by_location)) return []
  return stock_by_location.map((location) => ({
    province: location.province,
    locale_name: location.locale_name,
    sizes: Object.fromEntries(Object.entries(location.sizes).map(([size, stock]) => [size, {
      stock_quantity: stock.stock_quantity
    }]))
  }))
}

/**
 * Comprueba si alguna talla de un local tiene stock original mayor que cero.
 * @param {StockByLocation} location Local con inventario por talla.
 * @returns {boolean} true si el local tiene stock en alguna talla.
 */
function has_location_stock(location) {
  return Object.values(location.sizes).some((stock) => stock.stock_quantity > 0)
}

/**
 * Determina si un descuento está actualmente vigente según su rango de fechas (starts_at / ends_at).
 * @param {Discount} discount Descuento que se desea comprobar, con su rango de fechas.
 * @returns {boolean} true si la fecha actual está dentro del rango del descuento.
 */
function is_currently_on_discount(discount) {
  if (!discount) return false
  const now = Date.now()
  const starts_at = new Date(discount.starts_at).getTime()
  const ends_at = new Date(discount.ends_at).getTime()
  return starts_at <= now && ends_at >= now
}

/**
 * Lee y parsea el archivo JSON con los records de un canal de venta.
 * Por cada record:
 * - Si no tiene objectID, se le asigna el sku como identificador.
 * - Si no tiene image, la toma de la primera imagen del array images.
 * - Conserva el stock original por talla y local, sin reservas ni cantidades agregadas.
 * - Genera facets.size para el filtro de Algolia a partir de las tallas del stock.
 * - Calcula in_stock, provinces y on_discount.
 * @param {string} file_path Ruta del archivo JSON, relativa al directorio de ejecución.
 * @returns {Promise<ProductRecord[]>} Arreglo de records listos para indexar.
 * @throws {Error} Si el archivo no contiene un array válido.
 */
export async function get_records(file_path) {
  const content = await readFile(file_path, "utf-8")
  const records = JSON.parse(content)
  if (!Array.isArray(records)) {
    throw new Error("El JSON debe ser un array de objetos")
  }
  records.forEach((record) => {
    if (!record.objectID) {
      record.objectID = record.sku
    }
    if (!record.image && Array.isArray(record.images) && record.images.length > 0) {
      record.image = record.images[0]
    }
    record.stock_by_location = process_stock_by_location(record.stock_by_location)
    record.facets.size = [...new Set(record.stock_by_location.flatMap((location) => Object.keys(location.sizes)))]
    const locations_with_stock = record.stock_by_location.filter(has_location_stock)
    record.in_stock = locations_with_stock.length > 0
    record.provinces = [...new Set(locations_with_stock.map((location) => location.province))]
    record.on_discount = is_currently_on_discount(record.discount)
  })
  return records
}

/**
 * Reemplaza todos los records de un índice de productos por los del archivo indicado.
 * Conserva la configuración del índice; los records que ya no estén en el archivo se eliminan.
 * @param {string} file_path Ruta del archivo JSON con los records del canal.
 * @param {string | undefined} index_name Nombre del índice de Algolia que se desea poblar.
 * @param {string} index_variable Nombre de la variable de entorno del índice, para el mensaje de error.
 * @returns {Promise<void>}
 * @throws {Error} Si falta una variable de entorno, el archivo es inválido o falla la carga.
 */
export async function seed_products(file_path, index_name, index_variable) {
  const app_id = process.env.VITE_ALGOLIA_APPLICATION_ID
  const admin_api_key = process.env.VITE_ALGOLIA_ADMIN_API_KEY
  if (!app_id) throw new Error("Variable de entorno faltante: VITE_ALGOLIA_APPLICATION_ID")
  if (!admin_api_key) throw new Error("Variable de entorno faltante: VITE_ALGOLIA_ADMIN_API_KEY")
  if (!index_name) throw new Error(`Variable de entorno faltante: ${index_variable}`)
  const records = await get_records(file_path)
  const client = algoliasearch(app_id, admin_api_key)
  await client.replaceAllObjects({
    indexName: index_name,
    objects: records,
  })
}
