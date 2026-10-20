import { catalogApi } from './modules/api/catalog-api.js';
import { ordersApi } from './modules/api/orders-api.js';
import { usersApi } from './modules/api/users-api.js';
import { escapeHtml, formatCurrency } from './modules/utils/formatters.js';

const state = {
  products: [], category: '', size: '', search: '', cart: JSON.parse(localStorage.getItem('paso-cart') || '[]'),
  favorites: new Set(readFavorites()), catalogCache: new Map(), heroProducts: [], heroIndex: 0,
  user: JSON.parse(localStorage.getItem('paso-user') || 'null'), authMode: 'login', toastTimer: null,
  cartId: localStorage.getItem('paso-cart-id') || crypto.randomUUID(),
};
localStorage.setItem('paso-cart-id', state.cartId);
const palettes = ['#dfe4ca', '#e5dbce', '#d6dfdc', '#e3dccb', '#e8dfcf', '#d8ddc9', '#dcded5', '#e4ddce'];
const featuredProductIds = ['retro-court', 'urbano-nova', 'canvas-sun', 'daily-cloud'];
const featuredDetails = {
  'retro-court': { edition: '90', description: 'Amortiguación Air · Estilo icónico', caption: 'Movimiento natural' },
  'urbano-nova': { edition: 'AF1', description: 'Un clásico · Actitud urbana', caption: 'Un ícono de la calle' },
  'canvas-sun': { edition: 'OG', description: 'Archivo deportivo · Estilo atemporal', caption: 'Clásico dentro y fuera de cancha' },
  'daily-cloud': { edition: '1', description: 'Herencia basketball · Perfil bajo', caption: 'Historia en cada paso' },
};
const $ = (selector) => document.querySelector(selector);
const money = formatCurrency;

function readFavorites() {
  try {
    const favorites = JSON.parse(localStorage.getItem('paso-favorites') || '[]');
    return Array.isArray(favorites) ? favorites.filter((id) => typeof id === 'string') : [];
  } catch { return []; }
}

function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function saveCart() { localStorage.setItem('paso-cart', JSON.stringify(state.cart)); updateCartCount(); }
function updateCartCount() { $('#cart-count').textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0); }
function saveFavorites() {
  localStorage.setItem('paso-favorites', JSON.stringify([...state.favorites]));
  $('#favorites-count').textContent = state.favorites.size;
}
function toggleFavorite(productId) {
  if (state.favorites.has(productId)) {
    state.favorites.delete(productId);
    showToast('Quitaste el par de tus favoritos.');
  } else {
    state.favorites.add(productId);
    showToast('Par guardado en tus favoritos. No se agregó a la bolsa.');
  }
  saveFavorites();
  renderProducts();
}
function setFeaturedProducts(products) {
  state.heroProducts = featuredProductIds.map((id) => products.find((product) => product.id === id)).filter(Boolean);
  $('#hero-slide-tabs').innerHTML = state.heroProducts.map((product, index) => `<button class="hero-slide-tab${index === 0 ? ' selected' : ''}" id="hero-tab-${index}" type="button" role="tab" data-hero-index="${index}" aria-label="Mostrar ${escapeHtml(product.brand)} ${escapeHtml(product.name)}" aria-controls="hero-product-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}">${String(index + 1).padStart(2, '0')}</button>`).join('');
  renderFeaturedProduct(0);
}
function renderFeaturedProduct(index) {
  const product = state.heroProducts[index];
  if (!product) return;
  state.heroIndex = index;
  const details = featuredDetails[product.id] || { edition: String(index + 1), description: 'Un nuevo favorito · Paso Urbano', caption: 'Encuentra tu próximo par' };
  const image = $('#hero-shoe');
  image.src = product.image;
  image.alt = `${product.brand} ${product.name}`;
  $('#hero-model-name').textContent = `${product.brand} ${product.name}`;
  $('#hero-model-description').textContent = details.description;
  $('#hero-caption-text').textContent = details.caption;
  $('#hero-edition').textContent = details.edition;
  document.querySelectorAll('.hero-slide-tab').forEach((tab, tabIndex) => {
    const selected = tabIndex === index;
    tab.classList.toggle('selected', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  $('#hero-product-panel').setAttribute('aria-labelledby', `hero-tab-${index}`);
}
async function initializeCart() {
  const previousCart = state.cart;
  try {
    let cart = await ordersApi.getCart(state.cartId);
    if (!cart.items.length && previousCart.length) {
      for (const item of previousCart) {
        await ordersApi.setCartItem(state.cartId, { productId: item.productId, size: item.size, quantity: item.quantity });
      }
      cart = await ordersApi.getCart(state.cartId);
      if (cart.items.length) showToast('Tu bolsa anterior ya quedó guardada en MySQL.');
    }
    state.cart = cart.items; saveCart();
  } catch (error) { showToast(`No se pudo sincronizar la bolsa: ${error.message}`); }
}

function renderProducts() {
  const products = state.products;
  $('#catalog-status').textContent = `${products.length} ${products.length === 1 ? 'par disponible' : 'pares disponibles'}`;
  $('#empty-state').classList.toggle('hidden', products.length > 0);
  $('#product-grid').classList.toggle('hidden', products.length === 0);
  $('#product-grid').innerHTML = products.map((product, index) => {
    state.catalogCache.set(product.id, product);
    const sizes = product.variants.filter((variant) => variant.stock > 0).map((variant) => variant.size);
    const tag = index === 0 ? 'MÁS ELEGIDO' : index === 2 ? 'NUEVO' : '';
    const isFavorite = state.favorites.has(product.id);
    return `<article class="product-card">
      <div class="product-visual" style="--bubble:${palettes[index % palettes.length]}">
        ${tag ? `<span class="product-badge">${tag}</span>` : ''}<button class="favorite-toggle${isFavorite ? ' is-favorite' : ''}" data-favorite-toggle="${escapeHtml(product.id)}" data-tooltip="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}" aria-label="${isFavorite ? 'Quitar' : 'Agregar'} ${escapeHtml(product.name)} ${isFavorite ? 'de' : 'a'} favoritos" aria-pressed="${isFavorite}"><span aria-hidden="true">${isFavorite ? '♥' : '♡'}</span></button><button class="product-image-trigger" data-open-product="${escapeHtml(product.id)}" aria-label="Ver ${escapeHtml(product.name)}"><img class="product-photo" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async"></button>
        <button class="quick-add" data-add="${escapeHtml(product.id)}" data-tooltip="Elegir talla y agregar al carrito" aria-label="Elegir talla de ${escapeHtml(product.name)} para agregarlo al carrito"><span aria-hidden="true">+</span></button>
      </div>
      <div class="product-info"><div class="product-meta"><span>${escapeHtml(product.brand)}</span><span>★ 4.9</span></div><h3 class="product-name">${escapeHtml(product.name)}</h3><div class="product-bottom"><span class="product-price">${money(product.price)}</span><span class="product-sizes">Tallas ${sizes.slice(0, 4).join(' · ')}</span></div></div>
    </article>`;
  }).join('');
}
async function loadProducts() {
  $('#catalog-status').textContent = 'Buscando tu próximo par…';
  try {
    const data = await catalogApi.listProducts({ category: state.category, size: state.size, search: state.search });
    state.products = data.products;
    for (const product of data.products) state.catalogCache.set(product.id, product);
    if (!state.heroProducts.length) setFeaturedProducts(data.products);
    renderProducts();
  }
  catch (error) { $('#catalog-status').textContent = error.message; $('#product-grid').innerHTML = ''; }
}
async function addToCart(product, size) {
  await cartReady;
  const existing = state.cart.find((item) => item.productId === product.id && item.size === String(size));
  const quantity = (existing?.quantity || 0) + 1;
  try {
    const cart = await ordersApi.setCartItem(state.cartId, { productId: product.id, size: String(size), quantity });
    state.cart = cart.items; saveCart(); showToast(`${product.name}, talla ${size}, guardado en tu bolsa.`);
  } catch (error) { showToast(error.message); }
}
function openProduct(id) {
  const product = state.products.find((item) => item.id === id) || state.catalogCache.get(id);
  if (!product) return;
  const options = product.variants.filter((variant) => variant.stock > 0).map((variant) => `<option value="${variant.size}">${variant.size} · ${variant.stock} disponibles</option>`).join('');
  const images = [{ src: product.image, alt: `${product.name} — foto principal` }, ...(product.images || [])];
  const thumbnails = images.map((image, index) => `<button class="gallery-thumb${index === 0 ? ' selected' : ''}" type="button" data-gallery-src="${escapeHtml(image.src)}" data-gallery-alt="${escapeHtml(image.alt)}" aria-label="Mostrar foto ${index + 1} de ${images.length} de ${escapeHtml(product.name)}" aria-pressed="${index === 0}"><img src="${escapeHtml(image.src)}" alt="" loading="lazy" decoding="async"></button>`).join('');
  const isFavorite = state.favorites.has(product.id);
  const productIndex = Math.max(0, state.products.findIndex((item) => item.id === product.id));
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">Tu próximo par</h2><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div><div class="product-visual product-detail-visual" style="--bubble:${palettes[productIndex % palettes.length]}"><img id="product-gallery-main" class="product-photo" src="${escapeHtml(images[0].src)}" alt="${escapeHtml(images[0].alt)}" decoding="async"></div><div class="product-gallery-thumbnails" role="group" aria-label="Galería de fotos de ${escapeHtml(product.name)}">${thumbnails}</div><div class="product-info"><div class="product-meta"><span>${escapeHtml(product.brand)} · ${escapeHtml(product.category)}</span><span>★ 4.9</span></div><h3 class="product-name" style="font-size:22px">${escapeHtml(product.name)}</h3><p class="auth-copy">${escapeHtml(product.description)}</p><div class="product-price" style="font-size:15px;margin:15px 0">${money(product.price)}</div><button class="favorite-detail-toggle${isFavorite ? ' is-favorite' : ''}" data-favorite-toggle="${escapeHtml(product.id)}" aria-pressed="${isFavorite}">${isFavorite ? '♥ Guardado en favoritos' : '♡ Guardar en favoritos'}</button><label class="field"><span>Elige tu talla</span><select id="product-size">${options}</select></label><button id="add-selected" class="button button-dark full-button">Agregar a la bolsa <span>↗</span></button><p class="secure-note">Modelo comercial real · fotografías de referencia. Envío gratis desde $350.000 · Cambios fáciles hasta 30 días.</p></div></section></div>`;
  $('#add-selected').addEventListener('click', async () => { const size = $('#product-size').value; if (!size) return showToast('No hay tallas disponibles por ahora.'); await addToCart(product, size); closeModal(); });
}
async function openFavorites() {
  const missingProducts = [...state.favorites].some((id) => !state.catalogCache.has(id));
  if (missingProducts) {
    try {
      const { products } = await catalogApi.listProducts();
      for (const product of products) state.catalogCache.set(product.id, product);
    } catch (error) { showToast(`No se pudieron cargar tus favoritos: ${error.message}`); }
  }
  const products = [...state.favorites].map((id) => state.catalogCache.get(id)).filter(Boolean);
  const cards = products.map((product) => `<article class="favorite-card"><button class="favorite-card-image" data-open-favorite-product="${escapeHtml(product.id)}" aria-label="Ver detalles de ${escapeHtml(product.name)}"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async"></button><div class="favorite-card-copy"><span>${escapeHtml(product.brand)}</span><h3>${escapeHtml(product.name)}</h3><strong>${money(product.price)}</strong><button class="favorite-remove" data-remove-favorite="${escapeHtml(product.id)}">Quitar de favoritos</button></div><button class="favorite-card-open" data-open-favorite-product="${escapeHtml(product.id)}" aria-label="Ver detalles de ${escapeHtml(product.name)}">↗</button></article>`).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal-panel favorites-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">Tus favoritos</h2><p class="favorites-intro">Tus pares guardados, sin agregarlos a la bolsa.</p></div><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div>${products.length ? `<div class="favorites-list">${cards}</div>` : `<div class="favorites-empty"><span aria-hidden="true">♡</span><h3>Aún no guardas ningún par</h3><p>Toca el corazón de un zapato para tenerlo a mano. No se agregará a tu bolsa.</p><button class="button button-dark full-button" data-dismiss="true">Explorar la colección <span>↗</span></button></div>`}</section></div>`;
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function openCart() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = state.cart.map((item, index) => `<div class="cart-line"><div class="cart-thumb"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async"></div><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.brand || '')} · Talla ${escapeHtml(item.size)}</p><div class="quantity-control"><button data-qty="${index}" data-delta="-1" aria-label="Restar">−</button><span>${item.quantity}</span><button data-qty="${index}" data-delta="1" aria-label="Sumar">+</button><button class="remove-line" data-remove="${index}">Quitar</button></div></div><span class="cart-line-price">${money(item.price * item.quantity)}</span></div>`).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">Tu bolsa <span style="font:11px Arial;color:#899187">(${state.cart.length})</span></h2><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div>${state.cart.length ? `<div>${lines}</div><div class="cart-summary"><div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div><div class="summary-row"><span>Envío</span><span>${subtotal >= 350000 ? 'Gratis' : money(14000)}</span></div><div class="summary-row total"><span>Total estimado</span><span>${money(subtotal + (subtotal >= 350000 ? 0 : 14000))}</span></div><p class="cart-note">El envío se confirma al completar tu pedido. Pago de demostración, sin datos bancarios.</p><button id="go-checkout" class="button button-dark full-button">Continuar con mi compra <span>↗</span></button></div>` : `<div class="cart-empty"><span>▱</span><h3>Tu bolsa está esperando</h3><p>Encuentra ese par que va contigo.</p><button class="button button-dark" data-dismiss="true">Explorar zapatos <span>↗</span></button></div>`}</section></div>`;
  $('#go-checkout')?.addEventListener('click', openCheckout);
}
function openCheckout() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + (subtotal >= 350000 ? 0 : 14000);
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">Finalizar pedido</h2><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div><p class="auth-copy">Un último paso para estrenar tu nuevo par.</p><form id="checkout-form" class="checkout-form"><label class="field"><span>Nombre de quien recibe</span><input name="customerName" autocomplete="name" required minlength="2" value="${escapeHtml(state.user?.name || '')}" placeholder="Tu nombre" /></label><label class="field"><span>Correo electrónico</span><input name="customerEmail" type="email" autocomplete="email" required value="${escapeHtml(state.user?.email || '')}" placeholder="hola@correo.com" /></label><div class="secure-note">✓ Pago aprobado para demostración. No solicitamos información de tarjetas.</div><div class="summary-row total"><span>Total estimado</span><span>${money(total)}</span></div><button class="button button-dark full-button" type="submit">Confirmar pedido <span>↗</span></button></form></section></div>`;
  $('#checkout-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button[type=submit]'); button.disabled = true; button.textContent = 'Confirmando…';
    const form = new FormData(event.currentTarget);
    try {
      const order = await ordersApi.createOrder({ cartId: state.cartId, customerName: form.get('customerName'), customerEmail: form.get('customerEmail') });
      state.cart = []; saveCart(); state.products = state.products.map((product) => ({ ...product, variants: product.variants.map((variant) => ({ ...variant, stock: variant.stock - (order.items.find((item) => item.productId === product.id && item.size === variant.size)?.quantity || 0) })) }));
      showOrderSuccess(order);
    } catch (error) { button.disabled = false; button.innerHTML = 'Confirmar pedido <span>↗</span>'; showToast(error.message); }
  });
}
function showOrderSuccess(order) {
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><a class="brand" href="#inicio"><span class="brand-mark">P</span><span>PASO<span class="brand-light">URBANO</span></span></a><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div><div class="order-success"><span class="success-mark">✓</span><h3>¡Tu pedido está listo!</h3><p>Gracias, ${escapeHtml(order.customer_name)}. Guardamos los detalles de tu compra y enviamos la confirmación a ${escapeHtml(order.customer_email)}.</p><div class="order-code">${escapeHtml(order.id)}</div><p>Estado: ${escapeHtml(order.status)} · Pago: ${escapeHtml(order.payment_status)}</p><button class="button button-dark full-button" data-dismiss="true">Seguir explorando <span>↗</span></button></div></section></div>`;
  loadProducts();
}
function openAccount() {
  state.authMode = 'login'; renderAccount();
}
function renderAccount() {
  if (state.user) {
    $('#modal-root').innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal-panel" role="dialog" aria-modal="true"><div class="modal-head"><h2>Mi cuenta</h2><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div><div class="order-success"><span class="success-mark">${escapeHtml(state.user.name[0].toUpperCase())}</span><h3>Hola, ${escapeHtml(state.user.name.split(' ')[0])}</h3><p>${escapeHtml(state.user.email)}</p><button id="sign-out" class="button button-outline full-button">Cerrar sesión</button></div></section></div>`;
    $('#sign-out').addEventListener('click', () => { state.user = null; localStorage.removeItem('paso-user'); closeModal(); showToast('Sesión cerrada.'); }); return;
  }
  const registering = state.authMode === 'register';
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${registering ? 'Únete a Paso Urbano' : 'Qué bueno verte'}</h2><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div><div class="auth-tabs"><button class="auth-tab ${!registering ? 'selected' : ''}" data-auth-mode="login">Iniciar sesión</button><button class="auth-tab ${registering ? 'selected' : ''}" data-auth-mode="register">Crear cuenta</button></div><p class="auth-copy">${registering ? 'Guarda tus datos y sigue cada pedido.' : 'Inicia sesión para tener tus compras a mano.'}</p><form id="auth-form">${registering ? '<label class="field"><span>Nombre</span><input name="name" autocomplete="name" required minlength="2" placeholder="Tu nombre" /></label>' : ''}<label class="field"><span>Correo electrónico</span><input type="email" name="email" autocomplete="email" required placeholder="hola@correo.com" /></label><label class="field"><span>Contraseña</span><input type="password" name="password" autocomplete="${registering ? 'new-password' : 'current-password'}" required minlength="8" placeholder="Mínimo 8 caracteres" /></label><button class="button button-dark full-button" type="submit">${registering ? 'Crear cuenta' : 'Iniciar sesión'} <span>↗</span></button></form></section></div>`;
  $('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries());
    try {
      const result = registering ? await usersApi.register(payload) : await usersApi.login(payload);
      state.user = result.user;
      localStorage.setItem('paso-user', JSON.stringify(result.user));
      localStorage.setItem('paso-token', result.token);
      closeModal();
      showToast(`¡Hola, ${result.user.name.split(' ')[0]}!`);
    }
    catch (error) { showToast(error.message); }
  });
}

$('#product-grid').addEventListener('click', (event) => {
  const favorite = event.target.closest('[data-favorite-toggle]');
  if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favoriteToggle); return; }
  const addButton = event.target.closest('[data-add]');
  if (addButton) { event.stopPropagation(); openProduct(addButton.dataset.add); return; }
  const card = event.target.closest('[data-open-product]'); if (card) openProduct(card.dataset.openProduct);
});
$('#product-grid').addEventListener('keydown', (event) => { if (event.key === 'Enter' && event.target.matches('[data-open-product]')) openProduct(event.target.dataset.openProduct); });
$('#hero-slide-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-hero-index]');
  if (tab) renderFeaturedProduct(Number(tab.dataset.heroIndex));
});
$('#hero-slide-tabs').addEventListener('keydown', (event) => {
  const keyMoves = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
  if (!Object.hasOwn(keyMoves, event.key) || !state.heroProducts.length) return;
  event.preventDefault();
  const nextIndex = keyMoves[event.key] === 'first' ? 0 : keyMoves[event.key] === 'last' ? state.heroProducts.length - 1 : (state.heroIndex + keyMoves[event.key] + state.heroProducts.length) % state.heroProducts.length;
  renderFeaturedProduct(nextIndex);
  $(`#hero-tab-${nextIndex}`)?.focus();
});
$('.category-tabs').addEventListener('click', (event) => { const button = event.target.closest('[data-category]'); if (!button) return; state.category = button.dataset.category; document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('selected', tab === button)); loadProducts(); });
let searchTimer; $('#search-input').addEventListener('input', (event) => { clearTimeout(searchTimer); state.search = event.target.value.trim(); searchTimer = setTimeout(loadProducts, 220); });
$('#size-filter').addEventListener('change', (event) => { state.size = event.target.value; loadProducts(); });
$('#clear-filters').addEventListener('click', () => { state.category = ''; state.size = ''; state.search = ''; $('#search-input').value = ''; $('#size-filter').value = ''; document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('selected', tab.dataset.category === '')); loadProducts(); });
document.querySelectorAll('[data-category-link]').forEach((link) => link.addEventListener('click', () => { state.category = link.dataset.categoryLink; document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('selected', tab.dataset.category === state.category)); loadProducts(); }));
$('#cart-button').addEventListener('click', async () => { await cartReady; openCart(); }); $('#account-button').addEventListener('click', openAccount); $('#favorites-button').addEventListener('click', openFavorites);
$('#menu-button').addEventListener('click', () => $('.main-nav').classList.toggle('open'));
$('#modal-root').addEventListener('click', (event) => {
  const favoriteToggle = event.target.closest('[data-favorite-toggle]');
  if (favoriteToggle) { toggleFavorite(favoriteToggle.dataset.favoriteToggle); if ($('#modal-title')?.textContent === 'Tus favoritos') openFavorites(); else openProduct(favoriteToggle.dataset.favoriteToggle); return; }
  const favoriteRemove = event.target.closest('[data-remove-favorite]');
  if (favoriteRemove) { toggleFavorite(favoriteRemove.dataset.removeFavorite); openFavorites(); return; }
  const favoriteOpen = event.target.closest('[data-open-favorite-product]');
  if (favoriteOpen) { openProduct(favoriteOpen.dataset.openFavoriteProduct); return; }
  const galleryThumb = event.target.closest('[data-gallery-src]');
  if (galleryThumb) {
    const mainImage = $('#product-gallery-main');
    const galleryButtons = document.querySelectorAll('.gallery-thumb');
    mainImage.src = galleryThumb.dataset.gallerySrc;
    mainImage.alt = galleryThumb.dataset.galleryAlt;
    galleryButtons.forEach((button) => { const selected = button === galleryThumb; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
    return;
  }
  if (event.target.matches('[data-dismiss]')) { closeModal(); return; }
  const authTab = event.target.closest('[data-auth-mode]'); if (authTab) { state.authMode = authTab.dataset.authMode; renderAccount(); return; }
  const qty = event.target.closest('[data-qty]');
  if (qty) {
    const item = state.cart[Number(qty.dataset.qty)];
    if (item) void updateCartItem(item, item.quantity + Number(qty.dataset.delta));
    return;
  }
  const remove = event.target.closest('[data-remove]');
  if (remove) { const item = state.cart[Number(remove.dataset.remove)]; if (item) void updateCartItem(item, 0); }
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
$('#newsletter-form').addEventListener('submit', (event) => { event.preventDefault(); event.currentTarget.reset(); showToast('¡Gracias! Te escribiremos con novedades.'); });
async function updateCartItem(item, quantity) {
  try {
    const cart = quantity <= 0
      ? await ordersApi.removeCartItem(state.cartId, item.productId, item.size)
      : await ordersApi.setCartItem(state.cartId, { productId: item.productId, size: item.size, quantity });
    state.cart = cart.items; saveCart(); openCart();
  } catch (error) { showToast(error.message); }
}
updateCartCount(); loadProducts();
saveFavorites();
const cartReady = initializeCart();


