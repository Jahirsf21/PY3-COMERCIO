import type { CSSProperties } from "react"

type Star = {
  top: string
  left: string
  size: number
}

const stars: Star[] = [
  { top: "9%", left: "13%", size: 30 },
  { top: "40%", left: "7%", size: 22 },
  { top: "34%", left: "11%", size: 9 },
  { top: "7%", left: "17%", size: 6 },
  { top: "9%", left: "79%", size: 22 },
  { top: "16%", left: "82%", size: 6 },
  { top: "72%", left: "83%", size: 22 },
  { top: "60%", left: "94%", size: 8 },
]

const moon_surface: CSSProperties = {
  backgroundImage: [
    "radial-gradient(circle at 22% 30%, rgb(0 0 0 / 0.10) 0 7%, transparent 8%)",
    "radial-gradient(circle at 48% 22%, rgb(0 0 0 / 0.08) 0 4%, transparent 5%)",
    "radial-gradient(circle at 62% 46%, rgb(0 0 0 / 0.10) 0 9%, transparent 10%)",
    "radial-gradient(circle at 34% 60%, rgb(0 0 0 / 0.09) 0 6%, transparent 7%)",
    "radial-gradient(circle at 76% 70%, rgb(0 0 0 / 0.07) 0 5%, transparent 6%)",
    "radial-gradient(circle at 18% 78%, rgb(0 0 0 / 0.08) 0 4%, transparent 5%)",
    "radial-gradient(circle at 35% 30%, #fafafa, #d4d4d4 55%, #a3a3a3)",
  ].join(", "),
}

/**
 * Estrella de cuatro puntas usada como decoración.
 * @param props Propiedades de la estrella.
 * @param props.star Posición y tamaño de la estrella.
 * @returns Ícono SVG decorativo.
 */
function StarShape({ star }: { star: Star }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={star.size}
      height={star.size}
      className="absolute fill-neutral-700 dark:fill-neutral-300"
      style={{ top: star.top, left: star.left }}
    >
      <path d="M12 0 C12.8 7.6 16.4 11.2 24 12 C16.4 12.8 12.8 16.4 12 24 C11.2 16.4 7.6 12.8 0 12 C7.6 11.2 11.2 7.6 12 0 Z" />
    </svg>
  )
}

/**
 * Fondo decorativo de la pantalla de inicio de sesión: órbitas, estrellas y dos lunas en las esquinas.
 * Es solo visual y queda oculto para los lectores de pantalla.
 * @returns Capa decorativa que ocupa todo su contenedor, detrás del contenido.
 */
export function LoginBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-linear-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="absolute top-[18%] left-1/2 h-[120vh] w-[180vw] -translate-x-1/2 -rotate-12 rounded-[50%] border border-neutral-200 dark:border-neutral-800" />
      <div className="absolute top-[34%] left-1/2 h-[110vh] w-[200vw] -translate-x-1/2 rotate-[8deg] rounded-[50%] border border-neutral-200 dark:border-neutral-800" />
      {stars.map((star) => <StarShape key={`${star.top}-${star.left}`} star={star} />)}
      <div className="absolute -top-[24vw] -right-[12vw] size-[40vw] max-h-[34rem] max-w-[34rem] rounded-full opacity-70 shadow-2xl dark:opacity-30" style={moon_surface} />
      <div className="absolute -bottom-[28vw] -left-[12vw] size-[44vw] max-h-[38rem] max-w-[38rem] rounded-full opacity-80 shadow-2xl dark:opacity-30" style={moon_surface} />
    </div>
  )
}
