import { liteClient as algoliasearch } from "algoliasearch/lite"
import type { SalesChannel } from "@/lib/channel/types"

const app_id = import.meta.env.VITE_ALGOLIA_APPLICATION_ID;
const search_api_key = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
export const write_api_key = import.meta.env.VITE_ALGOLIA_WRITE_API_KEY

/**
 * Índices de productos de un canal: el principal y sus réplicas ordenadas por precio.
 */
export type ProductIndices = {
  main: string
  priceAsc: string
  priceDesc: string
}

/**
 * Índices de Algolia: los productos de cada canal de venta, los usuarios y los pedidos.
 */
export const algolia_indices: { products: Record<SalesChannel, ProductIndices>; users: string; orders: string } = {
  products: {
    b2c: {
      main: import.meta.env.VITE_ALGOLIA_B2C_INDEX,
      priceAsc: import.meta.env.VITE_ALGOLIA_B2C_PRICE_ASC_INDEX,
      priceDesc: import.meta.env.VITE_ALGOLIA_B2C_PRICE_DESC_INDEX,
    },
    b2b: {
      main: import.meta.env.VITE_ALGOLIA_B2B_INDEX,
      priceAsc: import.meta.env.VITE_ALGOLIA_B2B_PRICE_ASC_INDEX,
      priceDesc: import.meta.env.VITE_ALGOLIA_B2B_PRICE_DESC_INDEX,
    },
  },
  users: import.meta.env.VITE_ALGOLIA_USERS_INDEX,
  orders: import.meta.env.VITE_ALGOLIA_ORDERS_INDEX,
};

if (!app_id)
  console.error("Variable de entorno faltante: VITE_ALGOLIA_APPLICATION_ID");
if (!search_api_key)
  console.error("Variable de entorno faltante: VITE_ALGOLIA_SEARCH_API_KEY");

/**
 * Obtiene los índices de productos del canal de venta indicado.
 * @param channel Canal de venta cuyo catálogo se desea consultar.
 * @returns Índice principal y réplicas por precio del canal.
 */
export function get_product_indices(channel: SalesChannel): ProductIndices {
  return algolia_indices.products[channel]
}

/**
 * Cliente compartido de Algolia para consultar el catálogo con la clave de búsqueda.
 */
export const search_client = algoliasearch(app_id, search_api_key);
