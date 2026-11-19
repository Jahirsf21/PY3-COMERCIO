import { get_product_indices, search_client } from "@/lib/algolia/algolia"
import type { User } from "@/lib/auth/types"
import { get_cart_quantity_conditions, get_product_unit_price } from "@/lib/cart/cart"
import type { AdminCatalogOffer, AdminCatalogPage, AdminCatalogVariant, Discount } from "@/lib/catalog/types"
import type { SalesChannel } from "@/lib/channel/types"
import { is_non_negative_integer, is_nonempty_string, is_positive_integer, is_record, is_valid_currency, is_valid_date, is_valid_image, is_valid_price } from "@/lib/shared/utils"

/** Variante validada con los datos comerciales de un solo índice. */
type AdminIndexVariant = Omit<AdminCatalogVariant, "offers"> & { offer: AdminCatalogOffer }

const admin_catalog_channels: SalesChannel[] = ["b2c", "b2b"]
const admin_catalog_index_limit = 1000
const admin_catalog_page_size = 12
const admin_catalog_attributes: string[] = [
  "sku", "product_id", "title", "brand", "image", "facets.color", "price", "currency", "discount", "on_discount",
  "min_order_quantity", "max_order_quantity", "step_quantity",
]
const admin_catalog_read_error = "No pudimos consultar el catálogo. Intenta nuevamente."
const admin_catalog_data_error = "El catálogo contiene datos de productos inválidos."
const admin_catalog_incomplete_error = "No pudimos consultar todas las variantes de ambos canales."

/**
 * Valida el descuento marcado como activo y comprueba si sus fechas siguen vigentes.
 * @param value Descuento recibido del índice.
 * @param now Instante común de la consulta de ambos canales.
 * @returns Descuento vigente, o undefined si aún no empieza o ya venció.
 * @throws Si el descuento activo no contiene un porcentaje y un rango válidos.
 */
function parse_active_discount(value: unknown, now: number): Discount | undefined {
  if (!is_record(value)) throw new Error(admin_catalog_data_error)
  const { percentage, starts_at, ends_at } = value
  if (typeof percentage !== "number" || !(percentage >= 0 && percentage <= 100) ||
    !is_valid_date(starts_at) || !is_valid_date(ends_at)) {
    throw new Error(admin_catalog_data_error)
  }
  const starts_at_time = Date.parse(starts_at)
  const ends_at_time = Date.parse(ends_at)
  if (starts_at_time > ends_at_time) throw new Error(admin_catalog_data_error)
  return starts_at_time <= now && now <= ends_at_time ? { percentage, starts_at, ends_at } : undefined
}

/**
 * Lee los campos necesarios para identificar y comparar una variante de un índice.
 * @param hit Registro del catálogo sin validar.
 * @param now Instante usado para comprobar la vigencia del descuento.
 * @returns Datos de la variante y oferta del canal, sin recortar las cantidades por stock.
 * @throws Si el registro no permite presentar una oferta válida.
 */
function parse_admin_index_variant(hit: unknown, now: number): AdminIndexVariant {
  if (!is_record(hit)) throw new Error(admin_catalog_data_error)
  const { sku, product_id, title, brand, image, facets, currency, price, on_discount, min_order_quantity, max_order_quantity, step_quantity } = hit
  if (!is_nonempty_string(sku) || !is_nonempty_string(product_id) || !is_nonempty_string(title) || !is_nonempty_string(brand) ||
    !is_valid_image(image) || !is_record(facets) || !is_nonempty_string(facets.color) ||
    !is_valid_currency(currency) || !is_valid_price(price) || typeof on_discount !== "boolean" ||
    !is_positive_integer(min_order_quantity) || !is_positive_integer(max_order_quantity) || max_order_quantity < min_order_quantity ||
    !is_positive_integer(step_quantity)) {
    throw new Error(admin_catalog_data_error)
  }

  const discount = on_discount ? parse_active_discount(hit.discount, now) : undefined
  return {
    sku: sku.trim(),
    product_id: product_id.trim(),
    title: title.trim(),
    brand: brand.trim(),
    image: { url: image.url.trim(), alt: image.alt },
    color: facets.color.trim(),
    offer: {
      price,
      currency,
      unit_price: get_product_unit_price({ price, discount, on_discount: discount !== undefined }),
      discount_percentage: discount?.percentage ?? null,
      conditions: get_cart_quantity_conditions({ min_order_quantity, max_order_quantity, step_quantity }),
    },
  }
}

/**
 * Comprueba que la búsqueda no haya recortado las variantes del índice.
 * @param result Resultado sin validar de uno de los canales.
 * @returns Registros de ese canal, incluso si está vacío.
 * @throws Si la respuesta es inválida, parcial o supera el límite de búsqueda.
 */
function get_complete_catalog_hits(result: unknown): unknown[] {
  if (!is_record(result) || !Array.isArray(result.hits) ||
    !is_non_negative_integer(result.nbHits) || !is_non_negative_integer(result.nbPages)) {
    throw new Error(admin_catalog_read_error)
  }
  if (result.nbPages > 1 || result.nbHits !== result.hits.length || result.exhaustiveNbHits === false ||
    (is_record(result.exhaustive) && result.exhaustive.nbHits === false)) {
    throw new Error(admin_catalog_incomplete_error)
  }
  return result.hits
}

/**
 * Consulta ambos catálogos para ADMIN y combina las ofertas del mismo SKU.
 * @param user Usuario de la sesión simulada.
 * @returns Variantes ordenadas por título y SKU, con null donde no se venden.
 * @throws Si no hay acceso o no se pueden comparar los dos catálogos completos.
 */
export async function get_admin_catalog(user: User | null): Promise<AdminCatalogVariant[]> {
  if (user?.role !== "ADMIN") throw new Error("Solo el administrador puede consultar los precios de ambos canales.")
  const indices = admin_catalog_channels.map((channel) => get_product_indices(channel).main)
  if (indices.some((index_name) => !index_name) || new Set(indices).size !== admin_catalog_channels.length) {
    throw new Error("La consulta administrativa de productos no está configurada.")
  }

  const response = await search_client.searchWithHTTPInfo({
    requests: indices.map((index_name) => ({
      indexName: index_name,
      query: "",
      hitsPerPage: admin_catalog_index_limit,
      distinct: false,
      analytics: false,
      enableRules: false,
      attributesToRetrieve: admin_catalog_attributes,
      attributesToHighlight: [],
      attributesToSnippet: [],
    })),
  }).catch(() => { throw new Error(admin_catalog_read_error) })

  const results = response?.data?.results
  if (!Array.isArray(results) || results.length !== admin_catalog_channels.length) throw new Error(admin_catalog_read_error)

  const variants = new Map<string, AdminCatalogVariant>()
  const now = Date.now()
  for (const [index, channel] of admin_catalog_channels.entries()) {
    for (const hit of get_complete_catalog_hits(results[index])) {
      const { offer, ...variant } = parse_admin_index_variant(hit, now)
      const previous = variants.get(variant.sku)
      if (previous) {
        if (previous.product_id !== variant.product_id || previous.offers[channel] !== null) throw new Error(admin_catalog_data_error)
        previous.offers[channel] = offer
      } else {
        variants.set(variant.sku, { ...variant, offers: { b2c: null, b2b: null, [channel]: offer } })
      }
    }
  }
  return [...variants.values()].sort((first, second) => first.title.localeCompare(second.title, "es") || first.sku.localeCompare(second.sku, "es"))
}

/**
 * Normaliza las palabras de la búsqueda sin distinguir mayúsculas ni tildes.
 * @param value Texto de la consulta o de una variante.
 * @returns Texto normalizado para comparar.
 */
function normalize_catalog_text(value: string): string {
  return value.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es")
}

/**
 * Filtra las variantes consultadas y obtiene una página sin volver a consultar Algolia.
 * @param variants Catálogo administrativo ordenado.
 * @param query Palabras que deben coincidir con el nombre, la marca, el color o el SKU.
 * @param page Página solicitada, comenzando en 1.
 * @returns Página de hasta 12 variantes y total de coincidencias.
 */
export function get_admin_catalog_page(variants: AdminCatalogVariant[], query: string, page: number): AdminCatalogPage {
  const terms = normalize_catalog_text(query).split(/\s+/).filter(Boolean)
  const matches = terms.length === 0 ? variants : variants.filter(({ sku, title, brand, color }) => {
    const text = normalize_catalog_text(`${sku} ${title} ${brand} ${color}`)
    return terms.every((term) => text.includes(term))
  })
  const total_pages = Math.ceil(matches.length / admin_catalog_page_size)
  const current_page = Math.min(is_positive_integer(page) ? page : 1, Math.max(1, total_pages))
  const start = (current_page - 1) * admin_catalog_page_size
  return { variants: matches.slice(start, start + admin_catalog_page_size), current_page, total_pages, total_variants: matches.length }
}
