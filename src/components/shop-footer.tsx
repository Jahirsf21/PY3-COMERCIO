import { Link } from "react-router-dom"
import amex_logo from "@/assets/cards/amex.svg"
import mastercard_logo from "@/assets/cards/mastercard.svg"
import visa_logo from "@/assets/cards/visa.svg"
import { policies_index } from "@/lib/policies/policies"
import { get_store_groups } from "@/lib/stores/stores"

const payment_methods = [
  { src: visa_logo, alt: "Visa" },
  { src: mastercard_logo, alt: "Mastercard" },
  { src: amex_logo, alt: "American Express" },
]

/**
 * Pie de página de la tienda con sedes, enlaces de políticas y formas de pago.
 * La versión compacta muestra en una sola fila el derecho de autor, el enlace a Políticas y Ayuda y las formas de pago.
 * @param props Propiedades del pie de página.
 * @param props.compact Indica si se muestra la versión compacta, para pantallas que deben caber sin desplazamiento.
 * @returns Pie de página completo o compacto.
 */
export function ShopFooter({ compact = false }: { compact?: boolean }) {
  const store_groups = get_store_groups()

  if (compact) {
    return (
      <footer className="shrink-0 border-t border-input bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 text-sm text-muted-foreground lg:px-6">
          <p>© {new Date().getFullYear()} Space Shop</p>
          <Link to="/politicas-y-ayuda" className="hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Políticas y Ayuda
          </Link>
          <ul aria-label="Formas de pago" className="flex items-center gap-2">
            {payment_methods.map((method) => (
              <li key={method.alt}>
                <img src={method.src} alt={method.alt} className="h-6 w-auto" />
              </li>
            ))}
          </ul>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-input bg-muted/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:grid-cols-2 lg:px-6">
        <section aria-labelledby="footer-stores">
          <h2 id="footer-stores" className="mb-3 text-base font-semibold">Nuestras tiendas</h2>
          <ul className="space-y-3 text-sm">
            {store_groups.map((group) => (
              <li key={group.province}>
                <span className="font-medium">{group.province}</span>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {group.stores.map((store) => <li key={store.id}>{store.locale_name}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
        <nav aria-labelledby="footer-links">
          <h2 id="footer-links" className="mb-3 text-base font-semibold">Políticas y Ayuda</h2>
          <ul className="space-y-2 text-sm">
            {policies_index.map((section) => (
              <li key={section.id}>
                <Link to={`/politicas-y-ayuda#${section.id}`} className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-input">
        <section aria-labelledby="footer-payments" className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-4 lg:px-6">
          <h2 id="footer-payments" className="text-sm font-semibold">Formas de pago</h2>
          <ul className="flex flex-wrap items-center gap-3">
            {payment_methods.map((method) => (
              <li key={method.alt}>
                <img src={method.src} alt={method.alt} className="h-8 w-auto" />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="border-t border-input">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-center text-sm text-muted-foreground lg:px-6">
          © {new Date().getFullYear()} Space Shop
        </p>
      </div>
    </footer>
  )
}
