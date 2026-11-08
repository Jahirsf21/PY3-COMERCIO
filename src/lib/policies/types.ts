/**
 * Bloque de contenido de una política: párrafo, lista o tabla.
 * ordered indica si la lista es numerada y label permite resaltar el inicio de un elemento.
 */
export type PolicyBlock =
  | string
  | {
    type: "list"
    ordered?: boolean
    items: (string | { label: string; text: string })[]
  }
  | {
    type: "table"
    headers: string[]
    rows: string[][]
  }

/**
 * Subsección que puede seleccionarse de forma independiente, con su título y bloques en orden de lectura.
 */
export type PolicySubsection = {
  id: string
  title: string
  blocks: PolicyBlock[]
}

/**
 * Sección principal de las políticas con sus subsecciones en orden de lectura.
 */
export type PolicySection = {
  id: string
  title: string
  subsections: PolicySubsection[]
}

/**
 * Selección del contenido que se muestra en Políticas y Ayuda.
 * Distingue el documento completo, las preguntas frecuentes, una sección o una subsección.
 * section y subsection incluyen los datos de la política y, cuando corresponde, de su subsección.
 */
export type PolicySelection =
  | { type: "all"; id: string; title: string }
  | { type: "faq"; id: string; title: string }
  | { type: "section"; id: string; title: string; section: PolicySection }
  | { type: "subsection"; id: string; title: string; section: PolicySection; subsection: PolicySubsection }
