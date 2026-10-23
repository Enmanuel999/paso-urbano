# Revisión de usabilidad de Paso Urbano

Este documento identifica principios aplicados en la interfaz y el elemento que permite observarlos. Es una revisión del diseño y del código; no representa resultados de pruebas con usuarios.

| Principio | Aplicación en la app | Evidencia visible |
|---|---|---|
| Visibilidad del estado (Nielsen) | La bolsa muestra contador, artículos, cantidades, subtotal y total estimado. Las acciones muestran avisos y los pedidos tienen confirmación. | `client/src/App.jsx` (`cartCount`, avisos `toast`, estado `loading`/`catalogError`), `client/src/App.jsx` (`cart`, `Modal`) |
| Visibilidad del estado (Nielsen) | El destacado muestra el producto, una descripción y cuál de las cuatro pestañas está seleccionada; avanza cada seis segundos y tiene un control para pausar o reanudar. Se puede cambiar por clic o teclado. | `client/src/App.jsx` (`heroProducts`, `heroIndex`, `heroPaused`), `client/src/App.jsx` (carrusel con `useEffect`, pestañas accesibles) |
| Prevención y recuperación de errores (Nielsen) | Se exige una talla disponible, se valida el stock en el servidor y los formularios usan validación de correo/campos requeridos. El estado vacío ofrece limpiar filtros. | `client/src/App.jsx` (`Modal` de producto, selección de talla, estado vacío), `src/orders-service/application/useCases.js`, `client/src/App.jsx` (`required`, `type="email"`) |
| Reconocimiento en vez de recuerdo (Nielsen) | La talla y el precio permanecen visibles en cada línea de la bolsa; los filtros y categorías disponibles aparecen en pantalla. | `client/src/App.jsx` (`Modal` de bolsa), `client/src/App.jsx` (`.category-tabs`, `#size-filter`) |
| Control y libertad (Nielsen) | Se pueden guardar y quitar favoritos desde las tarjetas, abrir un apartado propio y explorar sus detalles sin que el favorito se agregue automáticamente a la bolsa. | `client/src/App.jsx` (`toggleFavorite`, `openFavorites`), `client/src/App.jsx` (`#favorites-button`) |
| Reconocimiento y control (Nielsen) | El zapato destacado y el botón «Ver detalles» abren la ficha del modelo activo; desde allí se puede guardar en favoritos de forma independiente o elegir talla para agregarlo a la bolsa. | `client/src/App.jsx` (modelo `featured`, acciones para abrir detalle desde el hero y la tarjeta) |
| Consistencia y estándares (Nielsen / Jakob) | La navegación y las acciones usan etiquetas y patrones repetidos; el botón de bolsa y la acción de agregar mantienen el mismo vocabulario. | `client/src/App.jsx`, `client/src/App.jsx` |
| Ley de Hick-Hyman | La búsqueda y los filtros por categoría/talla permiten acotar la colección, en lugar de obligar a recorrer todo el catálogo. | `client/src/App.jsx` (estados `search`, `category`, `size`; consulta `loadProducts`) |
| Ley de Fitts | Acciones principales y controles de cantidad tienen áreas clicables y se reorganizan para pantallas pequeñas. | `public/styles.css` (`.button`, `.quantity-control`, reglas `@media`) |
| Accesibilidad básica | Hay nombres accesibles para controles, regiones de estado anunciadas, etiquetas en formularios y foco visible para teclado en controles principales. | `client/src/App.jsx` (`aria-label`, `aria-live`, `label`), `public/styles.css` (`:focus-visible`) |

## Alcance

La adaptación móvil está implementada con reglas responsive. La accesibilidad es una base, no una certificación WCAG. Para evaluar cumplimiento con evidencia de uso real, el siguiente paso académico sería realizar pruebas moderadas con participantes, registrar tareas/errores/tiempos y corregir los hallazgos. No se incluyen métricas de usuarios que no se hayan medido.


## Panel de administración

El panel /admin.html incluye etiquetas persistentes en cada campo, mensajes de error anunciados con role=alert, estado de carga y resultado con aria-live, foco visible por teclado y objetivos amplios. La tabla permite buscar y filtrar por estado para reducir la carga de elección (Hick); edición y retiro se presentan junto al producto para favorecer reconocimiento y prevención de errores. Retirar pide una acción explícita y conserva referencias históricas. La pantalla de acceso explica el propósito y ofrece errores concretos sin revelar credenciales.
