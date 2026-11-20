# Proyecto 3: Entorno B2B, Roles, Precios e Inventario

Space Shop es un e-commerce de ropa, calzado y accesorios deportivos de marcas como Nike, Puma y Adidas. En este proyecto la tienda se extendió para operar también como comercio **B2B (Business-to-Business)**: atiende a clientes personas y empresas con precios y condiciones de compra distintas, maneja inventario por sucursal, guarda órdenes completas en Algolia e incluye un panel para el administrador. Se mantienen todas las funcionalidades de los Proyectos I y II y de los laboratorios anteriores.

**Curso:** IC-8063 Comercio Electrónico · Tecnológico de Costa Rica  
**Profesor:** Ing. Joss Pecou Johnson  
**Grupo:** 60

## Integrantes

| Nombre                   | Carné      |
| ------------------------ | ---------- |
| Deislher Sánchez Funez   | 2023032794 |
| Natalia Granados Rosales | 2021144286 |
| Owen Smith Cerdas        | 2024083328 |

## Enlaces

- **Aplicación desplegada:** https://jahirsf21.github.io/PY3-COMERCIO/
- **Repositorio:** https://github.com/Jahirsf21/PY3-COMERCIO.git

## Usuarios de prueba

El inicio de sesión es simulado y sirve para evaluar el comportamiento de cada rol. Los usuarios están en el índice de usuarios de Algolia, que guarda solo una versión cifrada (hash) de cada contraseña.

| Usuario               | Contraseña      | Rol        | Notas                                                                         |
| --------------------- | --------------- | ---------- | ----------------------------------------------------------------------------- |
| `maria.rojas`         | `SpaceB2C#1`    | B2C        | Cliente persona física                                                        |
| `carlos.mora`         | `SpaceB2C#2`    | B2C        | Segundo cliente, para comprobar que cada uno ve solo su carrito y sus pedidos |
| `compras.deportivacr` | `SpaceB2B#1`    | B2B        | Cliente empresa: Deportiva CR S.A.                                            |
| `admin`               | `SpaceAdmin#1`  | ADMIN      | Acceso al panel administrativo                                                |
| `sin.rol`             | `SpaceNoRole#1` | SUPERVISOR | Rol inválido: sirve para probar el rechazo del inicio de sesión               |

También se puede usar la tienda sin iniciar sesión, como **invitado**. En ese caso compra con las condiciones B2C.

## Roles y permisos

| Funcionalidad                                            | Invitado | B2C | B2B | ADMIN |
| -------------------------------------------------------- | :------: | :-: | :-: | :---: |
| Ver y buscar productos, elegir sucursal                  |    ✓     |  ✓  |  ✓  |   ✓   |
| Agregar al carrito, pagar y cancelar un pedido pendiente |    ✓     |  ✓  |  ✓  |   —   |
| Ver "Mis pedidos" y "Tu actividad"                       |    —     |  ✓  |  ✓  |   —   |
| Ver todas las órdenes, con filtros y estadísticas        |    —     |  —  |  —  |   ✓   |
| Ver y modificar precios, condiciones e inventario        |    —     |  —  |  —  |   ✓   |
| Ver las métricas de todos los usuarios                   |    —     |  —  |  —  |   ✓   |

- Al iniciar sesión, el encabezado muestra un botón con las iniciales del usuario. Al pulsarlo se ven su nombre, su rol y su empresa (si tiene).
- El administrador entra directamente al panel. Si intenta abrir el carrito o el pago, vuelve al catálogo.
- Un usuario que no es administrador no puede entrar al panel (`/admin`).

## Precios y condiciones B2B

Cada canal tiene su propio catálogo en Algolia. La aplicación elige el catálogo según el rol del usuario, sin que nadie tenga que seleccionarlo.

| Condición                    | B2C                                                                      | B2B                                   |
| ---------------------------- | ------------------------------------------------------------------------ | ------------------------------------- |
| Precio                       | De lista, con descuentos de temporada (10 % a 30 %) en algunos productos | 15 % menor que el precio B2C de lista |
| Cantidad mínima por producto | 1                                                                        | **5**                                 |
| Cantidad máxima por producto | 10 (5 en algunos productos)                                              | 100                                   |
| Variantes disponibles        | 244                                                                      | 106 (18 exclusivas de B2B)            |

**Condición comercial elegida:** compra mínima de 5 unidades por producto. Una empresa compra para revender o para equipar a su personal, así que el volumen mínimo es habitual en la venta al por mayor y justifica el precio más bajo.

Justo antes de crear la orden, la aplicación vuelve a consultar en Algolia el precio de cada producto. Así, el precio que ve el usuario siempre es el mismo que queda guardado en la orden.

## Multi-inventario

La tienda tiene cuatro sucursales: **Tienda Escazú** y **Tienda San José** (San José), y **Tienda Guápiles** y **Tienda Limón** (Limón). Cada producto guarda en Algolia sus unidades por sucursal y por talla.

- La sucursal se elige en el selector **Tienda** del encabezado o en el checkout.
- El detalle del producto y el carrito muestran las unidades disponibles en la sucursal elegida. Las unidades nunca se suman entre sucursales.
- Al cambiar de sucursal, el carrito se ajusta al nuevo stock y avisa qué cambió en el aviso **"Actualizamos tu carrito"**.
- No se puede comprar más de lo que hay en la sucursal. La sucursal queda guardada en la orden.

## Órdenes

Cada orden guarda número, fecha, usuario, rol, datos del cliente, empresa (B2B), productos, cantidades, precio aplicado, sucursal, subtotal, IVA (13 %), envío, total, canal, reglas de cantidad, estado de la orden y estado del pago.

- Las órdenes se guardan primero en el navegador y se sincronizan con el índice de órdenes de Algolia. Si no hay conexión, se envían solas cuando vuelve.
- Los clientes las consultan en **Mi cuenta → Mis pedidos** y solo ven las suyas.
- El envío cuesta ₡3 000. Es gratis desde ₡35 000 o si se retira en tienda.

## Panel administrativo

Disponible solo para el rol ADMIN. Tiene cuatro secciones:

| Sección        | Qué permite                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Órdenes**    | Ver todas las órdenes, buscarlas por número, destinatario o empresa, filtrarlas por tipo de cliente, sucursal y estados, y ver estadísticas. El detalle es de solo lectura. |
| **Productos**  | Ver los precios y las condiciones de compra de ambos canales, uno al lado del otro, y editarlos.                                                                            |
| **Inventario** | Consultar y modificar el stock por sucursal y talla.                                                                                                                        |
| **Analytics**  | Ver las métricas de uso de todos los usuarios del navegador.                                                                                                                |

Antes de guardar un cambio, la aplicación comprueba que nadie haya modificado ese dato mientras el administrador editaba. Cada intento queda registrado en un historial.

## Índices de Algolia

| Índice                | Contenido                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Productos (B2C y B2B) | Catálogo de cada canal: precios, condiciones de compra e inventario por sucursal y talla. Incluye réplicas para ordenar por precio. |
| Usuarios              | Usuarios de prueba, rol, empresa (B2B) y contraseña cifrada.                                                                        |
| Órdenes               | Órdenes generadas durante el proceso de compra.                                                                                     |

En el navegador (`localStorage`) se guardan la sesión, el carrito, la sucursal elegida, una copia de las órdenes y el historial de analytics de cada usuario.

## Analytics y personalización (Laboratorio 5)

Se mantiene el registro de eventos (`login`, `search`, `product_view`, `add_to_cart`, `checkout_start` y `purchase`), las secciones **Vistos recientemente** y **Recomendados para ti**, las búsquedas recientes y las métricas de uso. Los clientes las ven en **Tu actividad** y el administrador en **Analytics**.

## Cómo verificarlo

1. **Inicio de sesión B2C:** entrar con `maria.rojas`. El encabezado muestra sus iniciales y el rol B2C.
2. **Inicio de sesión B2B:** entrar con `compras.deportivacr`. El panel de la cuenta muestra la empresa Deportiva CR S.A.
3. **Inicio de sesión Admin:** entrar con `admin`. Se abre el panel administrativo.
4. **Rol inválido:** entrar con `sin.rol`. Aparece el aviso "Usuario sin rol válido".
5. **Precio B2C vs. B2B:** abrir el mismo producto con cada usuario. Por ejemplo, la Nike G.T. Cut 4 (Celeste) cuesta ₡49 974 en B2C y ₡42 478 en B2B.
6. **Condición B2B:** como B2B, intentar agregar menos de 5 unidades. La aplicación no lo permite y avisa "Compra mínima: 5 unidades".
7. **Selección de sucursal:** cambiar la tienda en el encabezado. La disponibilidad cambia y el carrito se ajusta.
8. **Validación de inventario:** pedir más unidades de las disponibles. La aplicación limita la cantidad y explica por qué.
9. **Orden B2C:** completar una compra con `maria.rojas` y revisarla en **Mis pedidos**.
10. **Orden B2B:** completar una compra con `compras.deportivacr`. La orden muestra la empresa, el precio B2B y la sucursal.
11. **Consulta administrativa:** con `admin`, abrir **Órdenes** y filtrar por tipo de cliente o sucursal.
12. **Restricción entre roles:** con un cliente, entrar a `/admin`. La aplicación lo devuelve al catálogo. Con `admin`, intentar abrir el carrito: también vuelve al catálogo.
