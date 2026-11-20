import type { Hit } from "instantsearch.js"
import type { SalesChannel } from "@/lib/channel/types"

/**
 * Descuento porcentual vigente durante un rango de fechas
 */
export type Discount = {
  percentage: number
  starts_at: string
  ends_at: string
}

/**
 * Imagen con url y texto alternativo para accesibilidad
 */
export type ProductImage = {
  url: string
  alt: string
}

/**
 * Stock original de una talla concreta, sin reservas ni disponibilidad calculada.
 */
export type StockBySize = {
  stock_quantity: number
}

/**
 * Stock de un local puntual dentro de una provincia
 */
export type StockByLocation = {
  province: string
  locale_name: string
  sizes: Record<string, StockBySize>
}

/**
 * Facetas del producto
 */
export type ProductFacets = {
  color: string
  size: string[]
  materials: string[]
  technology?: string
  recommend_use?: string[]
  gender: string[]
}

/**
 * Esquema del producto recibido por el servicio de catálogo.
 * Es el mismo en los índices de ambos canales: precio, reglas de cantidad e inventario
 * corresponden al canal del índice consultado. discount solo existe si el canal ofrece descuento.
 */
export type ProductRecord = {
  objectID: string
  sku: string
  product_id: string
  title: string
  description: string
  brand: string
  categories: string[]
  currency: string
  keywords: string[]
  image: ProductImage
  images: ProductImage[]
  rating: number,
  price: number
  discount?: Discount
  on_discount: boolean
  in_stock: boolean
  min_order_quantity: number
  max_order_quantity: number
  step_quantity: number
  stock_by_location: StockByLocation[]
  provinces: string[]
  facets: ProductFacets
}

/**
 * Resultado de consultar las variantes de un producto en un canal de venta.
 * productId y channel identifican la consulta que generó el resultado.
 */
export type VariantsResult = {
  productId: string
  channel: SalesChannel
  variants: ProductHit[]
  error: boolean
}

/**
 * Resultado de consultar las sugerencias del producto mostrado en el detalle.
 * request_key identifica la consulta que generó el resultado.
 */
export type ProductSuggestionsResult = {
  request_key: string
  products: ProductHit[]
  has_error: boolean
}

/** Variante del catálogo con los metadatos de búsqueda de Algolia. */
export type ProductHit = Hit<ProductRecord>

/** Precio y condiciones de compra de un SKU en un canal. */
export type AdminCatalogOffer = Pick<ProductRecord, "price" | "currency"> & {
  unit_price: number
  discount_percentage: number | null
  conditions: Pick<ProductRecord, "min_order_quantity" | "max_order_quantity" | "step_quantity">
}

/** Variante con una oferta por canal, o null en el canal donde no se vende. */
export type AdminCatalogVariant = Pick<ProductRecord, "sku" | "product_id" | "title" | "brand" | "image"> & {
  color: ProductFacets["color"]
  offers: Record<SalesChannel, AdminCatalogOffer | null>
}

/** Página de variantes que coinciden con una búsqueda en el panel. */
export type AdminCatalogPage = {
  variants: AdminCatalogVariant[]
  current_page: number
  total_pages: number
  total_variants: number
}
