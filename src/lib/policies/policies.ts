import type { PolicySection, PolicySelection } from "@/lib/policies/types"

/**
 * Metadatos del documento mostrado en la vista de Políticas y Ayuda.
 * updated_at usa el formato AAAA-MM-DD y updated_label contiene la fecha legible.
 */
export const policies_document = {
  title: "Políticas de Space Shop",
  updated_at: "2026-10-23",
  updated_label: "23 de octubre de 2026",
  version: "1.0",
}

/**
 * Contenido de términos y condiciones, devoluciones, envíos y privacidad, organizado por subsecciones.
 */
export const policy_sections: PolicySection[] = [
  {
    id: "terminos-y-condiciones",
    title: "Términos y Condiciones",
    subsections: [
      {
        id: "condiciones-de-uso-del-sitio",
        title: "Condiciones de uso del sitio",
        blocks: [
          "Space Shop es una tienda en línea de ropa, calzado y accesorios deportivos de marcas como Nike, Puma y Adidas, y es distribuidor autorizado de estas marcas en Costa Rica. Las marcas, logotipos y nombres comerciales que aparecen en el sitio pertenecen a sus respectivos dueños.",
          "El sitio está destinado a la consulta y compra de productos para uso personal. No se permite usarlo para actividades fraudulentas, intentar acceder a sus sistemas sin autorización ni copiar su contenido con fines comerciales. Procuramos que las fotografías, descripciones, tallas y colores sean lo más fieles posible; aun así, el color puede variar levemente según la pantalla de cada dispositivo.",
          "Al realizar una compra, usted acepta estos Términos y Condiciones marcando de forma expresa la casilla de aceptación del checkout, que siempre aparece desmarcada.",
        ],
      },
      {
        id: "condiciones-generales-de-compra",
        title: "Condiciones generales de compra",
        blocks: [
          "Los precios se muestran en colones costarricenses. El IVA del 13 % se calcula sobre el subtotal de la orden y se muestra por separado en el resumen de compra, junto con el costo de envío y el total final, antes de que usted confirme el pago. No se agregan cargos adicionales después de ese resumen.",
          "Algunos productos pueden tener descuentos por tiempo limitado. En esos casos indicamos el precio anterior, el precio con descuento y la fecha en que termina la promoción. Los productos con descuento tienen los mismos derechos de cambio, devolución y garantía que cualquier otro producto.",
          "Aceptamos tarjetas Visa, Mastercard y American Express. El pago se procesa por medio de un proveedor de pagos externo, por lo que Space Shop no almacena los datos de su tarjeta.",
          "Al finalizar el checkout se genera una orden con estado pendiente, que se confirma únicamente cuando el pago es aprobado. Si el pago es rechazado o se presenta un error, la orden no se confirma, no se realiza ningún cobro y usted puede intentar el pago nuevamente. La orden puede cancelarse sin costo mientras el pago no se haya realizado; una vez aprobado, ya no puede cancelarse, pero puede solicitar un cambio o una devolución según nuestra Política de Devoluciones.",
          "Todas las compras están sujetas a la disponibilidad de inventario. Si después de aprobado el pago un producto no estuviera disponible, se lo informaremos por correo y le reintegraremos el monto completo de ese producto.",
        ],
      },
      {
        id: "responsabilidades-del-cliente",
        title: "Responsabilidades del cliente",
        blocks: [
          {
            type: "list",
            items: [
              "Proporcionar información correcta y completa durante el checkout, en especial el correo, el teléfono y la dirección de entrega.",
              "Revisar la talla, el color y la cantidad de cada producto en el resumen de compra antes de confirmar el pago.",
              "Estar disponible para recibir el pedido en la dirección indicada o retirarlo en la tienda dentro del plazo establecido.",
              "Usar el sitio de forma lícita y respetar estas condiciones.",
            ],
          },
        ],
      },
      {
        id: "responsabilidades-de-la-tienda",
        title: "Responsabilidades de la tienda",
        blocks: [
          {
            type: "list",
            items: [
              "Vender únicamente productos originales, nuevos y en buen estado.",
              "Mostrar el costo total de la compra, incluidos el IVA y el envío, antes de solicitar el pago.",
              "Despachar los pedidos dentro de los plazos indicados en la Política de Envíos.",
              "Ofrecer una garantía de 30 días naturales por defectos de fabricación y atender las solicitudes de cambio y devolución.",
              "Tratar los datos personales según la Política de Privacidad.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "politica-de-devoluciones",
    title: "Política de Devoluciones",
    subsections: [
      {
        id: "plazo-para-solicitar-devoluciones",
        title: "Plazo para solicitar devoluciones",
        blocks: [
          "Usted cuenta con 30 días naturales a partir de la fecha de entrega, o de la fecha de retiro en tienda, para solicitar un cambio, una devolución o hacer válida la garantía por defectos de fabricación.",
        ],
      },
      {
        id: "condiciones-para-aprobar-una-devolucion",
        title: "Condiciones para aprobar una devolución",
        blocks: [
          "Para aprobar una devolución o un cambio, el producto debe estar limpio y con todas sus etiquetas originales. El calzado debe devolverse en su caja original, sin daños, y la suela no debe presentar señales de uso. En todos los casos debe indicar el número de orden de su compra.",
          "Si el producto llegó con un defecto de fabricación o no corresponde a lo que pidió, Space Shop asume todos los costos de envío. Si lo devuelve porque cambió de opinión, el costo del envío de la devolución corre por su cuenta; puede evitarlo entregándolo en cualquiera de nuestras tiendas.",
        ],
      },
      {
        id: "casos-en-los-que-no-se-aceptan-devoluciones",
        title: "Casos en los que no se aceptan devoluciones",
        blocks: [
          {
            type: "list",
            items: [
              "Ropa interior, calcetines y trajes de baño, por motivos de higiene, salvo que presenten un defecto de fabricación.",
              "Productos usados, lavados, alterados o dañados después de la entrega.",
              "Productos con desgaste normal por uso, daños por uso inadecuado o accidentes.",
              "Solicitudes presentadas después de los 30 días naturales a la entrega.",
            ],
          },
        ],
      },
      {
        id: "procedimiento-general-para-gestionar-solicitudes",
        title: "Procedimiento general para gestionar solicitudes",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              { label: "Solicitud:", text: "escriba a spaceshop@gmail.com o al WhatsApp +506 8322-6524 con su número de orden, el producto, el motivo y, si se trata de un defecto, fotografías." },
              { label: "Respuesta:", text: "le responderemos en un máximo de 2 días hábiles con las instrucciones a seguir." },
              { label: "Entrega del producto:", text: "envíelo por Correos de Costa Rica o entréguelo en cualquiera de nuestras tiendas." },
              { label: "Revisión:", text: "revisamos el producto en un máximo de 7 días hábiles y le informamos el resultado por correo o el medio utilizado." },
              { label: "Resolución:", text: "si la solicitud es aprobada, realizamos el cambio o el reembolso." },
            ],
          },
          "El primer cambio de talla de cada producto no tiene costo; a partir del segundo, el envío cuesta ₡3 000, salvo que el cambio se haga en tienda. Los reembolsos se realizan al mismo método de pago utilizado en la compra. Space Shop los gestiona en un máximo de 3 días hábiles después de aprobar la solicitud, y el tiempo en que el dinero se refleja en su cuenta depende de los plazos de su banco o emisor de la tarjeta.",
        ],
      },
    ],
  },
  {
    id: "politica-de-envios",
    title: "Política de Envíos",
    subsections: [
      {
        id: "cobertura-de-entrega",
        title: "Cobertura de entrega",
        blocks: [
          "Realizamos envíos a las siete provincias de Costa Rica por medio de Correos de Costa Rica. No realizamos envíos fuera del país. También puede retirar su pedido sin costo en nuestras tiendas de Limón, Guápiles, San José y Escazú.",
        ],
      },
      {
        id: "tiempos-estimado-de-envio",
        title: "Tiempos estimado de envío",
        blocks: [
          {
            type: "list",
            items: [
              { label: "Gran Área Metropolitana (GAM):", text: "de 1 a 3 días hábiles." },
              { label: "Resto del país:", text: "de 3 a 6 días hábiles." },
              { label: "Retiro en tienda:", text: "le avisaremos por correo cuando su pedido esté listo, normalmente de 1 a 2 días hábiles." },
            ],
          },
          "Los tiempos se cuentan a partir de la confirmación del pago. Cuando su pedido sea despachado, le enviaremos por correo el número de guía de Correos de Costa Rica para que pueda darle seguimiento.",
        ],
      },
      {
        id: "costos-de-envio",
        title: "Costos de envío",
        blocks: [
          "El costo de envío es el mismo para cualquier zona del país:",
          {
            type: "table",
            headers: ["Subtotal de la orden", "Costo de envío"],
            rows: [
              ["Menor a ₡35 000", "₡3 000"],
              ["Igual o mayor a ₡35 000", "Gratis"],
              ["Retiro en tienda", "Gratis"],
            ],
          },
          "El costo de envío se muestra en el carrito y en el resumen de compra antes del pago. No existen cargos adicionales por zona, peso o manejo.",
        ],
      },
      {
        id: "restricciones-o-condiciones-especiales",
        title: "Restricciones o condiciones especiales",
        blocks: [
          {
            type: "list",
            items: [
              "Los pedidos confirmados después de las 3:00 p. m., o en domingos y feriados, se procesan el siguiente día hábil.",
              "Los tiempos pueden extenderse por feriados, condiciones climáticas u otras situaciones fuera de nuestro control. Si su pedido se atrasa, se lo informaremos por correo o a los medios de contacto proveídos.",
              "Si el pedido no puede entregarse por una dirección incompleta o porque nadie lo recibe, nos comunicaremos con usted para coordinar un nuevo envío o el retiro en tienda.",
              "Los pedidos para retiro en tienda se guardan durante 15 días naturales. Para retirarlos debe presentar el número de orden y una identificación con el nombre del comprador; si otra persona lo retira, debe presentar una autorización escrita del comprador y su propia identificación.",
              "Si el paquete llega abierto o dañado, tome fotografías y comuníquese con nosotros dentro de las 48 horas siguientes a la entrega.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "politica-de-privacidad",
    title: "Política de Privacidad",
    subsections: [
      {
        id: "informacion-que-recopila-la-tienda",
        title: "Información que recopila la tienda",
        blocks: [
          "Durante el checkout solicitamos su número de identificación, nombre completo, correo electrónico, correo electrónico alternativo, número de teléfono, número de teléfono alternativo, provincia, cantón, distrito, dirección exacta, código postal y, si usted la proporciona, información adicional para la entrega. En cada orden también registramos los productos comprados, los montos, el estado del pago y la fecha.",
          "No solicitamos crear una cuenta ni una contraseña, ya que las compras se realizan como invitado. Tampoco recibimos ni almacenamos el número completo de su tarjeta ni su código de seguridad, pues el pago lo procesa directamente el proveedor de pagos.",
          "El contenido de su carrito se guarda en el almacenamiento local de su navegador para que no se pierda al cerrar la página. Esta información permanece en su dispositivo y puede eliminarla vaciando el carrito o borrando los datos del sitio en su navegador. No usamos cookies de publicidad ni de rastreo.",
        ],
      },
      {
        id: "uso-de-la-informacion-del-cliente",
        title: "Uso de la información del cliente",
        blocks: [
          "Usamos sus datos únicamente para procesar su orden y su pago, coordinar la entrega o el retiro en tienda, contactarle sobre su pedido y atender cambios, devoluciones y garantías. No enviamos correos promocionales ni boletines.",
          "Compartimos solo los datos necesarios con Correos de Costa Rica, para realizar la entrega, y con el proveedor de pagos, para procesar el cobro. No vendemos, alquilamos ni cedemos sus datos a otras empresas.",
        ],
      },
      {
        id: "medidas-basicas-de-proteccion-de-datos",
        title: "Medidas básicas de protección de datos",
        blocks: [
          {
            type: "list",
            items: [
              "El sitio utiliza conexión cifrada (HTTPS).",
              "El acceso a la información de las órdenes está limitado al personal que la necesita para atender su compra.",
              "Conservamos los datos de las órdenes solo durante el tiempo necesario para cumplir con la compra, las garantías y las obligaciones legales y contables.",
              "De acuerdo con la Ley 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales, usted puede solicitar el acceso, la corrección o la eliminación de sus datos escribiendo a spaceshop@gmail.com. Responderemos en un máximo de 5 días hábiles.",
            ],
          },
        ],
      },
    ],
  },
]

/**
 * Preguntas frecuentes y sus respuestas.
 */
export const faq_section = {
  id: "preguntas-frecuentes",
  title: "Preguntas Frecuentes (FAQ)",
  questions: [
    {
      question: "¿Los productos son originales?",
      answer: "Sí. Space Shop es distribuidor autorizado y todos los productos son originales y nuevos.",
    },
    {
      question: "¿Necesito crear una cuenta para comprar?",
      answer: "No. Puede comprar como invitado; solo necesita completar sus datos en el checkout.",
    },
    {
      question: "¿Puedo cancelar mi pedido?",
      answer: "Sí, sin costo, siempre que el pago no se haya realizado. Una vez aprobado el pago, puede solicitar un cambio o una devolución cuando reciba el producto.",
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Tarjetas Visa, Mastercard y American Express.",
    },
    {
      question: "¿El precio incluye el IVA?",
      answer: "El IVA del 13 % se calcula sobre el subtotal de su orden. Antes de pagar, el resumen de compra le muestra el subtotal, el IVA, el envío y el total final, sin cargos adicionales posteriores.",
    },
    {
      question: "¿Qué pasa si mi pago es rechazado?",
      answer: "No se realiza ningún cobro y su orden no se confirma. Puede revisar los datos de su tarjeta e intentarlo de nuevo, o usar otra tarjeta.",
    },
    {
      question: "¿Cuánto cuesta el envío y cuánto tarda?",
      answer: "₡3 000 a cualquier parte del país, o gratis si el subtotal de su orden es de ₡35 000 o más. Tarda de 1 a 3 días hábiles en la GAM y de 3 a 6 días hábiles en el resto del país.",
    },
    {
      question: "¿Puedo retirar mi pedido en una tienda?",
      answer: "Sí, sin costo, en nuestras tiendas de Limón, Guápiles, San José y Escazú.",
    },
    {
      question: "¿Cuánto tiempo tengo para devolver un producto?",
      answer: "30 días naturales desde la entrega, siempre que el producto esté limpio y con sus etiquetas. El primer cambio de talla es gratis.",
    },
    {
      question: "¿Cuándo recibo mi reembolso?",
      answer: "Lo gestionamos en un máximo de 3 días hábiles después de aprobar la devolución. El tiempo en que se refleja en su cuenta depende de su banco.",
    },
    {
      question: "¿Cómo me comunico con Space Shop?",
      answer: "Por correo a spaceshop@gmail.com o por teléfono y WhatsApp al +506 8322-6524, de lunes a sábado de 9:00 a. m. a 7:00 p. m. y domingo de 9:00 a. m. a 1:00 p. m.",
    },
  ],
}

/**
 * Índice de navegación compartido por el menú lateral y los enlaces del footer.
 * Incluye identificadores y títulos, sin los bloques de contenido; las preguntas frecuentes no tienen subíndices.
 */
export const policies_index = [
  ...policy_sections.map(({ id, title, subsections }) => ({
    id,
    title,
    subsections: subsections.map(({ id, title }) => ({ id, title })),
  })),
  { id: faq_section.id, title: faq_section.title, subsections: [] },
]

/**
 * Resuelve el contenido que se debe mostrar al seleccionar una sección, subsección o las preguntas frecuentes.
 * Un identificador vacío o sin coincidencias muestra toda la información.
 * @param id Identificador del tema tomado del fragmento de la ruta
 * @returns Selección del tema encontrado, o del documento completo si el identificador no coincide.
 */
export function get_policy_selection(id: string): PolicySelection {
  if (id === faq_section.id) return { type: "faq", id, title: faq_section.title }

  for (const section of policy_sections) {
    if (id === section.id) return { type: "section", id, title: section.title, section }
    const subsection = section.subsections.find((item) => item.id === id)
    if (subsection) return { type: "subsection", id, title: subsection.title, section, subsection }
  }

  return { type: "all", id: "", title: "Toda la información" }
}
