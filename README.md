# Paso Urbano 👟

Tienda web universitaria de zapatos, con microservicios, arquitectura hexagonal, Express y MySQL. Incluye catálogo con tallas/inventario, cuentas, bolsa, pedidos y pago de demostración.

## Requisitos

- Node.js 22.9 o posterior.
- MySQL Server 8.0 activo en `127.0.0.1:3306`.
- MySQL Workbench para ejecutar el esquema y consultar los datos.

## Configurar MySQL con Workbench

1. Abre MySQL Workbench y conéctate a tu servidor local **MySQL80**.
2. Si aún no creaste las bases, abre `database/mysql-schema.sql` en Workbench y ejecuta el script completo con el botón del rayo. Se crean tres esquemas: `paso_catalog`, `paso_orders` y `paso_users`, con tablas, modelos conocidos de Nike/Jordan y adidas, tallas, inventario y almacenamiento de bolsas. Si ya habías ejecutado una versión anterior, ejecuta las migraciones necesarias: `database/mysql-cart-migration.sql`, `database/mysql-shoe-images-migration.sql`, `database/mysql-product-gallery-migration.sql` y, al final, `database/mysql-famous-models-migration.sql` para reemplazar los productos de muestra por los modelos nuevos y actualizar sus fotografías y galerías. Las fotos locales se sirven desde `public/images/shoes/`; sus referencias y créditos están en `docs/shoe-images.md`.
3. Copia `.env.example` como `.env`. Escribe la contraseña local de MySQL en `MYSQL_PASSWORD` y reemplaza `CATALOG_INTERNAL_TOKEN` con un valor privado largo (no compartas ni agregues `.env` al repositorio). Si tu cuenta tiene otro usuario o puerto, actualiza también esos valores.
4. En PowerShell, desde esta carpeta, inicia la app. El comando inicia cada microservicio y el Gateway como procesos Node independientes:

```powershell
npm start
```

5. Abre <http://localhost:3000>.

### Panel de administración

En una instalación existente, ejecuta una sola vez database/mysql-admin-panel-migration.sql desde Workbench. Después, agrega ADMIN_USERNAME y ADMIN_PASSWORD al archivo local .env (usuario de 3–40 caracteres y contraseña de al menos 16 caracteres), guarda y reinicia npm start. El servicio de Usuarios crea o actualiza un único administrador con contraseña derivada mediante PBKDF2; no existe una clave predeterminada. Abre <http://localhost:3000/admin.html> para entrar. El panel permite crear y editar productos, precios, fotos, tallas/stock, retirar y reactivar artículos. Retirar conserva el producto para las referencias de pedidos históricos. Las peticiones administrativas requieren una sesión de 8 horas; cinco intentos fallidos desde una misma IP bloquean nuevos intentos durante 15 minutos.

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

El navegador habla con el API Gateway. Pedidos consulta Catálogo por HTTP para validar precios y reservar unidades. Las operaciones internas de inventario requieren `CATALOG_INTERNAL_TOKEN` y no se publican a través del Gateway. Si falla la escritura del pedido después de reservar el stock, Pedidos solicita al Catálogo que libere la reserva como acción compensatoria. Cada microservicio posee su propio esquema y se ejecuta como proceso Node independiente; `npm start` los coordina para desarrollo. `Express` expone las rutas HTTP de los microservicios y el Gateway; los adaptadores HTTP traducen solicitudes a casos de uso. `mysql2` conecta Node.js con MySQL; no se instala nada desde Workbench para la app. Cada navegador conserva un identificador de bolsa y el servicio de Pedidos persiste sus líneas en MySQL al agregar, cambiar cantidad o quitar un zapato. Cada servicio expone `GET /health` en su puerto para indicar que el proceso responde.

## Arquitectura hexagonal

Cada servicio separa `domain/` (entidades/reglas), `application/` (casos de uso y puertos) y `adapters/` (HTTP y MySQL). Los casos de uso dependen de contratos de repositorio y las reglas de dominio no dependen de MySQL ni del servidor HTTP. El adaptador MySQL implementa el puerto de salida; los servidores HTTP traducen solicitudes a casos de uso. En Catálogo y Pedidos, las reglas de precio, talla, stock y totales están en entidades/casos de uso.

Los principios de Código Limpio y SOLID también están aplicados en módulos del frontend y del servicio Pedidos. Consulta [`docs/clean-code-solid.md`](docs/clean-code-solid.md) para ver cada principio con los archivos donde se refleja.

## Usabilidad aplicada

- Estado visible: bolsa, avisos de acciones y confirmación/estado del pedido.
- Prevención de errores: talla obligatoria, validación de existencias y de formularios.
- Reconocimiento: talla, cantidad y precio visibles en la bolsa.
- Consistencia / ley de Jakob: navegación y acciones predecibles.
- Ley de Hick: filtros sencillos por categoría y talla y búsqueda.
- Ley de Fitts: botones grandes y cómodos para móvil.
- Accesibilidad básica: etiquetas, foco de teclado, `aria-live` y diseño adaptable.

La relación entre principios y elementos concretos de la interfaz está en [`docs/usability-audit.md`](docs/usability-audit.md). Es una inspección del diseño, no una prueba de usabilidad con participantes ni una certificación de accesibilidad. Los favoritos se guardan en el navegador bajo `paso-favorites`, separado de la bolsa sincronizada con MySQL; no añaden artículos a la compra.

## Endpoints principales

```text
GET  /api/products?search=&category=&size=
GET  /api/products/:id
POST /api/users/admin/login
GET  /api/users/admin/me
POST /api/users/admin/logout
GET  /api/admin/products
POST /api/admin/products
PUT  /api/admin/products/:id
PATCH /api/admin/products/:id
POST /api/users/register
POST /api/users/login
GET  /api/users/me
GET  /api/orders/carts/:cartId
PUT  /api/orders/carts/:cartId/items
DELETE /api/orders/carts/:cartId/items/:productId/:size
POST /api/orders
GET  /api/orders/:id
```

Las rutas administrativas de Catálogo requieren sesión válida y el Gateway añade el token interno solo después de verificarla; no se exponen secretos en el navegador.

Las rutas de reserva y liberación de inventario (`POST /reserve` y `POST /release`) son internas del servicio Catálogo y requieren el token compartido; el Gateway no las expone al navegador.

## Datos SQLite anteriores

La versión inicial de demostración usaba SQLite. Los archivos de respaldo y adaptadores anteriores se conservan en `legacy-sqlite/`; la versión actual ya no los consulta. MySQL es la base activa.
