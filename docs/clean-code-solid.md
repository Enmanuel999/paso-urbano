# Código limpio y SOLID en Paso Urbano

Esta guía relaciona decisiones que ya están en el código con principios concretos. El objetivo es que las reglas de compra no dependan de la interfaz ni de una tecnología de persistencia específica.

## Cambios aplicados

| Principio | Aplicación en el proyecto | Ubicación |
|---|---|---|
| Responsabilidad única (S) | El cliente HTTP común solo hace solicitudes y traduce errores; los módulos de Catálogo, Pedidos y Usuarios conocen sus propios endpoints; los formateadores se ocupan de moneda y escape HTML. En el backend, las operaciones de bolsa y de pedido tienen adaptadores distintos. | `public/modules/api/http-client.js`, `public/modules/api/*-api.js`, `public/modules/utils/formatters.js`, `src/orders-service/adapters/mysqlCartRepository.js`, `src/orders-service/adapters/mysqlOrderRepository.js` |
| Abierto/cerrado (O) | El caso de uso de Pedidos recibe un `CatalogClient`. Se puede añadir otro adaptador de Catálogo sin cambiar las reglas de creación de pedidos. | `src/orders-service/application/ports/CatalogClient.js`, `src/orders-service/adapters/httpCatalogClient.js`, `src/orders-service/application/useCases.js` |
| Sustitución de Liskov (L) | Los adaptadores concretos implementan los contratos de sus puertos y se pueden intercambiar manteniendo los mismos métodos. | `src/orders-service/application/ports/`, `src/orders-service/adapters/` |
| Segregación de interfaces (I) | El contrato de bolsa solo contiene operaciones de bolsa y el de pedidos solo operaciones de pedidos; los casos de uso reciben solo las dependencias que necesitan. | `src/orders-service/application/ports/CartRepository.js`, `OrderRepository.js`; `src/orders-service/application/useCases.js` |
| Inversión de dependencias (D) | Los casos de uso reciben repositorios y cliente de Catálogo por inyección. No crean conexiones MySQL ni construyen URLs HTTP ni llaman a `fetch` directamente. | `src/orders-service/application/useCases.js`, `src/orders-service/main.js` |

## Capas del frontend

- `client/src/App.jsx` conserva la interacción y el estado de la tienda mediante componentes React.
- `public/modules/api/` agrupa la comunicación con el Gateway por área funcional, bajo una ruta que no interfiere con el prefijo REST `/api/`.
- `public/modules/utils/formatters.js` contiene funciones reutilizables y sin dependencia del DOM.
- El cliente HTTP acepta una implementación de `fetch` como dependencia para facilitar su sustitución.

## Límite de la refactorización

Se mantuvieron las rutas REST y el formato de las respuestas para conservar el flujo existente. La revisión fue estática; no se ejecutaron pruebas automatizadas como parte de estos cambios. Conviene añadir pruebas unitarias de casos de uso con repositorios/clientes falsos antes de seguir ampliando el sistema.


## Panel administrativo

- **Responsabilidad única:** Admin/domain valida identidad; AdminRepository y su adaptador MySQL manejan persistencia y sesiones; casos de uso coordinan autenticación; Catálogo mantiene la lógica de productos/stock; Gateway comprueba sesión y enruta.
- **Inversión de dependencias:** los casos de uso de administrador dependen del puerto AdminRepository; Catálogo depende del puerto CatalogRepository.
- **Abierto/cerrado:** operaciones administrativas se incorporan como casos de uso y rutas específicas sin mover el dominio del catálogo al Gateway.
- **Seguridad de credenciales:** contraseña con PBKDF2 y salt aleatorio; solo el hash SHA-256 del token de sesión se persiste; el secreto interno del catálogo permanece en el servidor.
