# Laboratorio 4: Confianza Digital y Políticas Comerciales

Space Shop es un e-commerce de ropa, calzado y accesorios deportivos de marcas como Nike, Puma y Adidas. En este laboratorio se amplió la tienda con una sección de información comercial y con la aceptación de los Términos y Condiciones durante el checkout, con el objetivo de ofrecer una experiencia de compra transparente y libre de patrones oscuros.

**Curso:** IC-8063 Comercio Electrónico · Tecnológico de Costa Rica  
**Profesor:** Ing. Joss Pecou Johnson  
**Grupo:** 60  

## Integrantes

| Nombre | Carné |
|---|---|
| Deislher Sánchez Funez | 2023032794 |
| Natalia Granados Rosales | 2021144286 |
| Owen Smith Cerdas  | 2024083328 |


## Enlaces

- **Aplicación desplegada:** https://jahirsf21.github.io/LAB4-COMERCIO/
- **Repositorio:** https://github.com/Jahirsf21/LAB4-COMERCIO.git
## Funcionalidades del laboratorio

### Sección de políticas y ayuda

La página `/politicas-y-ayuda` reúne toda la información comercial de la tienda y es accesible desde el footer:

| Sección | Contenido |
|---|---|
| Términos y Condiciones | Condiciones de uso del sitio, condiciones generales de compra y responsabilidades del cliente y de la tienda |
| Política de Devoluciones | Plazo, condiciones de aprobación, casos no aceptados y procedimiento para gestionar solicitudes |
| Política de Envíos | Cobertura, tiempos estimados, costos y restricciones |
| Política de Privacidad | Información recopilada, uso de los datos y medidas de protección |
| Preguntas Frecuentes | Dudas sobre compras, pagos, envíos, devoluciones y atención al cliente |

Cada sección y subsección tiene su propio enlace mediante el fragmento de la URL, por ejemplo:

```
/politicas-y-ayuda                          → documento completo
/politicas-y-ayuda#terminos-y-condiciones   → solo esa sección
/politicas-y-ayuda#preguntas-frecuentes     → solo las preguntas frecuentes
```

### Aceptación de términos en el checkout

- La ventana de la orden incluye una casilla, **desmarcada por defecto**, para aceptar los Términos y Condiciones y la Política de Privacidad.
- Si el usuario intenta continuar sin marcarla, se muestra un mensaje de validación junto a la casilla y no puede avanzar al pago.
- Los enlaces a las políticas se abren sin que el usuario pierda los datos del formulario.
- La aceptación queda registrada en la orden:

```ts
termsAcceptance: {
  accepted: true,
  acceptedAt: "2026-10-23T22:15:00.000Z", // fecha y hora de la aceptación
}
```

- La ventana de pagos recuerda las condiciones aceptadas cerca del botón de pagar, y la confirmación de la orden muestra la fecha y la versión de los términos aceptados.

## Decisiones de diseño

- **Contenido separado de la presentación:** los textos viven como datos en `policies.ts`, con su estructura definida en `types.ts`. Para modificar una política no es necesario tocar componentes ni estilos.
- **Índice adaptable:** en computadora se muestra como una columna fija; en móvil, como un menú desplegable.
- **Consistencia visual:** las secciones usan los mismos estilos, colores y componentes del resto de la tienda.
- **Accesibilidad:** etiquetas ARIA, jerarquía correcta de títulos, foco visible y soporte para movimiento reducido.
