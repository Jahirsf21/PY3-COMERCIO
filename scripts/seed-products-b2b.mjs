import { seed_products } from "./lib/product-records.mjs"

/**
 * Pobla el índice de productos del canal B2B con data/records-b2b.json y maneja errores.
 */
seed_products("data/records-b2b.json", process.env.VITE_ALGOLIA_B2B_INDEX, "VITE_ALGOLIA_B2B_INDEX").catch((error) => {
  console.error("Error al poblar el índice de productos B2B:", error)
  process.exit(1)
})
