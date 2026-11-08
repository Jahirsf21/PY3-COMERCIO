# Laboratorio 5: Simulación de Analytics

Space Shop es un e-commerce de ropa, calzado y accesorios deportivos de marcas como Nike, Puma y Adidas. En este laboratorio se agregó a la tienda un registro de las acciones de cada persona, contenido personalizado a partir de ese historial y una página de métricas de uso. Todo se guarda en el navegador mediante `localStorage`, sin servicios externos, y los datos se generan únicamente con el uso real de la tienda.

**Curso:** IC-8063 Comercio Electrónico · Tecnológico de Costa Rica  
**Profesor:** Ing. Joss Pecou Johnson  
**Grupo:** 60  

## Integrantes

| Nombre | Carné |
|---|---|
| Deislher Sánchez Funez | 2023032794 |
| Natalia Granados Rosales | 2021144286 |
| Owen Smith Cerdas | 2024083328 |

## Enlaces

- **Aplicación desplegada:** https://jahirsf21.github.io/PY3-COMERCIO/
- **Repositorio:** https://github.com/Jahirsf21/PY3-COMERCIO.git

## Usuarios de prueba

| Usuario | Contraseña | Rol | Notas |
|---|---|---|---|
| `maria.rojas` | `SpaceB2C#1` | B2C | Cliente persona física |
| `carlos.mora` | `SpaceB2C#2` | B2C | Cliente persona física |
| `compras.deportivacr` | `SpaceB2B#1` | B2B | Cliente persona jurídica |
| `admin` | `SpaceAdmin#1` | ADMIN | Ve las métricas de todos los usuarios |
| `sin.rol` | `SpaceNoRole#1` | SUPERVISOR | Rol inválido: sirve para probar el rechazo del inicio de sesión |

## Eventos registrados

| Evento | Cuándo se registra | Información que se guarda |
|---|---|---|
| `login` | Al iniciar sesión correctamente | Identificador del usuario y su rol |
| `search` | Cuando la persona termina de escribir en el buscador | El texto buscado |
| `product_view` | Al abrir el detalle de un producto | Identificador, SKU, nombre y categorías |
| `add_to_cart` | Al agregar un producto al carrito | Producto, talla, cantidad, precio y moneda |
| `checkout_start` | Al entrar al proceso de pago | Cantidad de productos, unidades, total y moneda |
| `purchase` | Cuando se aprueba el pago de una orden | Número de orden, cantidad de productos, total y moneda |

Cada evento guarda un identificador propio, el tipo, la fecha y hora y los datos de la acción. La búsqueda solo se registra cuando la persona deja de escribir por un momento, con al menos dos caracteres y si el texto cambió respecto a la búsqueda anterior; así, una palabra escrita letra por letra cuenta como una sola búsqueda.

## Estructura de los datos

Los datos se guardan por separado para cada persona. Quien usa la tienda sin iniciar sesión recibe automáticamente una sesión de invitado, de modo que su historial no se mezcla con el de ningún usuario.

| Qué se guarda | Clave en `localStorage` | Máximo |
|---|---|---|
| Historial de eventos (del más antiguo al más reciente) | `space-shop-events:<usuario>` | Los 500 más recientes |
| Productos vistos recientemente | `space-shop-viewed-products:<usuario>` | 10, sin repetir |
| Búsquedas recientes | `space-shop-recent-searches:<usuario>` | 10, sin repetir |

- Un producto o búsqueda repetidos no se duplican: pasan al primer lugar de la lista. Las búsquedas no distinguen mayúsculas de minúsculas.
- Los productos vistos no guardan precio ni imagen; esos datos se consultan actualizados al mostrarlos.
- Los datos guardados se validan antes de usarse y los registros dañados se descartan. Si el navegador no permite guardar, la tienda sigue funcionando con los datos de la visita actual y muestra un aviso.

## Personalización

1. **Vistos recientemente** (catálogo): los últimos productos abiertos, con imagen, precio y disponibilidad actualizados.
2. **Recomendados para ti** (catálogo y carrito):
   - Se ordenan las categorías de los productos vistos por frecuencia; en caso de empate gana la del producto visto más recientemente. Se ignoran categorías generales como "Hombre" o "Mujer".
   - Se buscan hasta 20 productos de esas categorías y, si faltan, se completan con las tres búsquedas más recientes.
   - Se excluyen los productos ya vistos y sus otras versiones (y, en el carrito, los que ya están en él), y solo se recomiendan productos disponibles en la sede seleccionada.
3. **Búsquedas recientes**: al hacer clic en el buscador vacío se abre un panel con las últimas búsquedas. Elegir una la repite, la registra de nuevo y la sube al primer lugar. Se puede usar con el teclado (flechas y Escape).

Las secciones personalizadas del catálogo solo aparecen cuando hay historial y la persona está en la vista inicial: sin búsqueda activa, sin filtros y en la primera página.

## Métricas de uso

Disponible solo con sesión iniciada, desde el panel **Mi cuenta** (botón con las iniciales del usuario en el encabezado). El enlace se llama **Tu actividad** para clientes y **Métricas de uso** para el administrador.

| Métrica | Qué muestra |
|---|---|
| Productos visualizados | Veces que se abrió el detalle de un producto y cantidad de productos distintos |
| Búsquedas realizadas | Cantidad de búsquedas |
| Productos agregados al carrito | Veces que se agregó algo al carrito y unidades totales |
| Compras realizadas | Compras completadas con pago aprobado |

- El gráfico **Actividad por día** muestra los últimos siete días con un color por tipo de acción, una leyenda, el detalle al pasar el cursor y la opción **Ver datos en tabla**.
- Cada usuario ve solo sus propias métricas. Los invitados que intentan abrir la página son redirigidos al inicio de sesión, aunque su actividad se sigue registrando.
- El administrador ve además **Actividad de los usuarios**: la actividad de todos los usuarios que han usado la tienda en ese navegador, con un gráfico de usuarios registrados y no registrados con actividad, sus métricas y su gráfico por día.

## Cómo verificarlo

Abrir las herramientas de desarrollador (Application → Local Storage) y revisar la clave `space-shop-events:<usuario>` tras cada acción:

1. **Inicio de sesión** → aparece un evento `login` con el usuario y su rol.
2. **Búsqueda** → escribir "Nike" y esperar: se registra un único evento `search`.
3. **Vista de producto** → evento `product_view` y el producto aparece en `space-shop-viewed-products:<usuario>`.
4. **Agregar al carrito** → evento `add_to_cart` con producto, talla, cantidad, precio y moneda.
5. **Checkout y compra** → evento `checkout_start` y, al aprobar el pago, `purchase` con el número de orden y el total.
6. **Personalización** → tras ver varios productos de una categoría (p. ej. Running), la página principal del catálogo muestra "Vistos recientemente" y "Recomendados para ti".
7. **Métricas** → desde Mi cuenta, "Tu actividad" o "Métricas de uso" muestra la actividad del usuario.
