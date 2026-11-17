import { seed_products } from "./lib/product-records.mjs"

/**
 * Pobla el índice de productos del canal B2C con data/records-b2c.json y maneja errores.
 */
seed_products("data/records-b2c.json", process.env.VITE_ALGOLIA_B2C_INDEX, "VITE_ALGOLIA_B2C_INDEX").catch((error) => {
  console.error("Error al poblar el índice de productos B2C:", error)
  process.exit(1)
})
