# Revisión de usabilidad de Paso Urbano

Este documento identifica principios aplicados en la interfaz y el elemento que permite observarlos. Es una revisión del diseño y del código; no representa resultados de pruebas con usuarios.

| Principio | Aplicación en la app | Evidencia visible |
|---|---|---|
| Visibilidad del estado (Nielsen) | La bolsa muestra contador, artículos, cantidades, subtotal y total estimado. Las acciones muestran avisos y los pedidos tienen confirmación. | `public/index.html` (`#cart-count`, `#toast`, `#catalog-status`), `public/app.js` (`renderCart`, `showToast`) |
| Visibilidad del estado (Nielsen) | El destacado muestra el producto, una descripción y cuál de las cuatro pestañas está seleccionada; se puede cambiar por clic o teclado. | `public/index.html` (`#hero-slide-tabs`, `#hero-model-name`), `public/app.js` (`renderFeaturedProduct`) |
| Prevención y recuperación de errores (Nielsen) | Se exige una talla disponible, se valida el stock en el servidor y los formularios usan validación de correo/campos requeridos. El estado vacío ofrece limpiar filtros. | `public/app.js` (`openProduct`, `addToCart`, `#clear-filters`), `src/orders-service/application/useCases.js`, `public/index.html` (`required`, `type="email"`) |
| Reconocimiento en vez de recuerdo (Nielsen) | La talla y el precio permanecen visibles en cada línea de la bolsa; los filtros y categorías disponibles aparecen en pantalla. | `public/app.js` (`renderCart`), `public/index.html` (`.category-tabs`, `#size-filter`) |
| Control y libertad (Nielsen) | Se pueden guardar y quitar favoritos desde las tarjetas, abrir un apartado propio y explorar sus detalles sin que el favorito se agregue automáticamente a la bolsa. | `public/app.js` (`toggleFavorite`, `openFavorites`), `public/index.html` (`#favorites-button`) |
| Consistencia y estándares (Nielsen / Jakob) | La navegación y las acciones usan etiquetas y patrones repetidos; el botón de bolsa y la acción de agregar mantienen el mismo vocabulario. | `public/index.html`, `public/app.js` |
| Ley de Hick-Hyman | La búsqueda y los filtros por categoría/talla permiten acotar la colección, en lugar de obligar a recorrer todo el catálogo. | `public/index.html` (`#search-input`, `.category-tabs`, `#size-filter`), `public/app.js` (`loadProducts`) |
| Ley de Fitts | Acciones principales y controles de cantidad tienen áreas clicables y se reorganizan para pantallas pequeñas. | `public/styles.css` (`.button`, `.quantity-control`, reglas `@media`) |
| Accesibilidad básica | Hay nombres accesibles para controles, regiones de estado anunciadas, etiquetas en formularios y foco visible para teclado en controles principales. | `public/index.html` (`aria-label`, `aria-live`, `label`), `public/styles.css` (`:focus-visible`) |

## Alcance

La adaptación móvil está implementada con reglas responsive. La accesibilidad es una base, no una certificación WCAG. Para evaluar cumplimiento con evidencia de uso real, el siguiente paso académico sería realizar pruebas moderadas con participantes, registrar tareas/errores/tiempos y corregir los hallazgos. No se incluyen métricas de usuarios que no se hayan medido.
