# Paso Urbano 👟

Tienda web universitaria de zapatos, con microservicios, arquitectura hexagonal y MySQL. Incluye catálogo con tallas/inventario, cuentas, bolsa, pedidos y pago de demostración.

## Requisitos

- Node.js 22.9 o posterior.
- MySQL Server 8.0 activo en `127.0.0.1:3306`.
- MySQL Workbench para ejecutar el esquema y consultar los datos.

## Configurar MySQL con Workbench

1. Abre MySQL Workbench y conéctate a tu servidor local **MySQL80**.
2. Si aún no creaste las bases, abre `database/mysql-schema.sql` en Workbench y ejecuta el script completo con el botón del rayo. Se crean tres esquemas: `paso_catalog`, `paso_orders` y `paso_users`, con tablas, zapatos de ejemplo y almacenamiento de bolsas. Si ya habías ejecutado una versión anterior del esquema, ejecuta `database/mysql-cart-migration.sql` para agregar las tablas de bolsa.
3. Copia `.env.example` como `.env`. Escribe la contraseña local de MySQL en `MYSQL_PASSWORD` (no la compartas ni agregues el archivo `.env` al repositorio). Si tu cuenta tiene otro usuario o puerto, actualiza también esos valores.
4. En PowerShell, desde esta carpeta, inicia la app. El comando inicia cada microservicio y el Gateway como procesos Node independientes:

```powershell
npm start
```

5. Abre <http://localhost:3000>.

Para inspeccionar la base, en Workbench actualiza el panel **Schemas** y expande cada esquema. Las bolsas activas aparecen en `paso_orders.carts` y `paso_orders.cart_items`; al confirmar una compra, sus artículos pasan a `paso_orders.order_items` y la bolsa queda vacía. El inventario se actualiza en `paso_catalog.variants`; las cuentas quedan en `paso_users.users` y `paso_users.sessions`.

También puedes iniciar servicios por separado (útil para presentar y depurar): `npm run start:catalog`, `npm run start:orders`, `npm run start:users` y `npm run start:gateway`. Usa una terminal por servicio; todos requieren las variables de `.env`. `npm start` es el modo coordinado recomendado. Detén el modo coordinado con Ctrl+C antes de iniciarlo de nuevo para liberar los puertos.

Para consultar los zapatos que hay ahora en bolsas activas:

```sql
SELECT c.cart_id, ci.name AS zapato, ci.size AS talla,
       ci.quantity AS cantidad, ci.unit_price AS precio,
       c.updated_at AS actualizado
FROM paso_orders.carts c
JOIN paso_orders.cart_items ci ON ci.cart_id = c.cart_id
ORDER BY c.updated_at DESC;
```

## Microservicios

| Servicio | Puerto | Responsabilidad | Esquema MySQL |
|---|---:|---|---|
| Catálogo | 3101 | Productos, variantes y stock | `paso_catalog` |
| Pedidos | 3102 | Bolsa persistente, pedidos y artículos comprados | `paso_orders` |
| Usuarios | 3103 | Registro, inicio de sesión y sesiones | `paso_users` |
| API Gateway + web | 3000 | Interfaz y enrutamiento REST | — |

El navegador habla con el API Gateway. Pedidos consulta Catálogo por HTTP para obtener precios vigentes y reservar unidades. Cada microservicio posee su propio esquema y se ejecuta como proceso Node independiente; `npm start` los coordina para desarrollo. `mysql2` conecta Node.js con MySQL; no se instala nada desde Workbench para la app. Cada navegador conserva un identificador de bolsa y el servicio de Pedidos persiste sus líneas en MySQL al agregar, cambiar cantidad o quitar un zapato. Cada servicio expone `GET /health` en su puerto para indicar que el proceso responde.

## Arquitectura hexagonal

Cada servicio separa `domain/` (entidades/reglas), `application/` (casos de uso y puertos) y `adapters/` (HTTP y MySQL). Los casos de uso dependen de contratos de repositorio y las reglas de dominio no dependen de MySQL ni del servidor HTTP. El adaptador MySQL implementa el puerto de salida; los servidores HTTP traducen solicitudes a casos de uso. En Catálogo y Pedidos, las reglas de precio, talla, stock y totales están en entidades/casos de uso.

## Usabilidad aplicada

- Estado visible: bolsa, avisos de acciones y confirmación/estado del pedido.
- Prevención de errores: talla obligatoria, validación de existencias y de formularios.
- Reconocimiento: talla, cantidad y precio visibles en la bolsa.
- Consistencia / ley de Jakob: navegación y acciones predecibles.
- Ley de Hick: filtros sencillos por categoría y talla y búsqueda.
- Ley de Fitts: botones grandes y cómodos para móvil.
- Accesibilidad básica: etiquetas, foco de teclado, `aria-live` y diseño adaptable.

La relación entre principios y elementos concretos de la interfaz está en [`docs/usability-audit.md`](docs/usability-audit.md). Es una inspección del diseño, no una prueba de usabilidad con participantes ni una certificación de accesibilidad.

## Endpoints principales

```text
GET  /api/products?search=&category=&size=
GET  /api/products/:id
POST /api/catalog/reserve
POST /api/users/register
POST /api/users/login
GET  /api/users/me
GET  /api/orders/carts/:cartId
PUT  /api/orders/carts/:cartId/items
DELETE /api/orders/carts/:cartId/items/:productId/:size
POST /api/orders
GET  /api/orders/:id
```

## Datos SQLite anteriores

La versión inicial de demostración usaba SQLite. Los archivos de respaldo y adaptadores anteriores se conservan en `legacy-sqlite/`; la versión actual ya no los consulta. MySQL es la base activa.
