import type { ReactNode } from "react"
import { Link } from "react-router-dom"

type PolicyLinkProps = {
  to: string
  children: ReactNode
}

/**
 * Enlace a una sección de Políticas y Ayuda que se abre en una pestaña nueva.
 * Así la persona puede leer las políticas sin perder los datos escritos en el checkout o el pago.
 * Al estar dentro de un label, el navegador no cambia la casilla al activar el enlace.
 * @param props Propiedades del enlace.
 * @param props.to Ruta de la sección en Políticas y Ayuda, por ejemplo "/politicas-y-ayuda#terminos-y-condiciones".
 * @param props.children Texto visible del enlace.
 * @returns Enlace con target="_blank" y rel="noopener noreferrer".
 */
export function PolicyLink({ to, children }: PolicyLinkProps) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </Link>
  )
}
