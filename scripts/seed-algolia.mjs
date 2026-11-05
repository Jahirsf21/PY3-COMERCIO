import "dotenv/config"
import { algoliasearch } from "algoliasearch"
import { readFile } from "node:fs/promises"

const app_id = process.env.VITE_ALGOLIA_APPLICATION_ID
const admin_api_key = process.env.VITE_ALGOLIA_ADMIN_API_KEY
if (!app_id) console.error("Variable de entorno faltante: VITE_ALGOLIA_APPLICATION_ID")
if (!admin_api_key) console.error("Variable de entorno faltante: VITE_ALGOLIA_ADMIN_API_KEY")

const index_name = process.env.VITE_ALGOLIA_MAIN_INDEX
const client = algoliasearch(app_id, admin_api_key);

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
 * Obtiene la lista de provincias sin duplicados que tienen stock disponible
 * en alguna talla, combinando uno o varios arreglos de stock por local (ej. b2c y b2b).
 * @param {...StockByLocation[]} stock_arrays
 * @returns {string[]} Lista de provincias (province) sin duplicados con stock disponible.
 */
function get_provinces_with_stock(...stock_arrays) {
  const provinces = new Set()
  for (const arr of stock_arrays) {
    if (!Array.isArray(arr)) continue
    for (const location of arr) {
      if (has_location_stock(location)) provinces.add(location.province)
    }
  }
  return [...provinces]
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
 * Lee y parsea el archivo JSON con los records a indexar.
 * Por cada record:
 * - Si no tiene objectID, se le asigna el sku como identificador.
 * - Si no tiene image, la toma de la primera imagen del array images
 * - Conserva el stock original por talla, local y canal, sin reservas ni cantidades agregadas.
 * - Pone en cero el precio y las reglas del canal que el producto no vende y vacía sus locales.
 * - Genera facets.size para el filtro de Algolia a partir de las tallas del stock.
 * - Calcula in_stock_b2c, in_stock_b2b, provinces y on_discount.
 * @returns {Promise<ProductRecord[]>} Arreglo de records
 * @throws {Error} Si el archivo no contiene un array válido.
 */
async function get_records() {
  const content = await readFile("data/records.json", "utf-8")
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
    if (record.sales_channels.includes("b2c")) {
      record.b2c_stock_by_location = process_stock_by_location(record.b2c_stock_by_location)
    } else {
      record.b2c_price = 0;
      record.b2c_min_order_quantity = 0;
      record.b2c_max_order_quantity = 0;
      record.b2c_step_quantity = 0;
      record.b2c_stock_by_location = [];
    }
    if (record.sales_channels.includes("b2b")) {
      record.b2b_stock_by_location = process_stock_by_location(record.b2b_stock_by_location)
    } else {
      record.b2b_price = 0;
      record.b2b_min_order_quantity = 0;
      record.b2b_max_order_quantity = 0;
      record.b2b_step_quantity = 0;
      record.b2b_stock_by_location = [];
    }
    record.facets.size = [...new Set([
      ...record.b2c_stock_by_location,
      ...record.b2b_stock_by_location
    ].flatMap(location => Object.keys(location.sizes)))]
    record.in_stock_b2c = record.b2c_stock_by_location.some(has_location_stock)
    record.in_stock_b2b = record.b2b_stock_by_location.some(has_location_stock)
    record.provinces = get_provinces_with_stock(record.b2c_stock_by_location, record.b2b_stock_by_location)
    record.on_discount = is_currently_on_discount(record.b2c_discount)
  });
  return records;
}

/**
 * Obtiene los records de get_records() y los sube al índice de Algolia definido en index_name.
 * @returns {Promise<void>}
 */
async function seed_algolia() {
  const records = await get_records();
  await client.saveObjects({
    indexName: index_name,
    objects: records,
  })
}

/**
 * Ejecuta el seed y maneja errores
 */
seed_algolia().catch((error) => {
  console.error("Error al poblar el indice:", error);
  process.exit(1);
});
