const state = {
  products: [], category: '', size: '', search: '', cart: JSON.parse(localStorage.getItem('paso-cart') || '[]'),
  user: JSON.parse(localStorage.getItem('paso-user') || 'null'), authMode: 'login', toastTimer: null,
  cartId: localStorage.getItem('paso-cart-id') || crypto.randomUUID(),
};
localStorage.setItem('paso-cart-id', state.cartId);
const palettes = ['#dfe4ca', '#e5dbce', '#d6dfdc', '#e3dccb', '#e8dfcf', '#d8ddc9', '#dcded5', '#e4ddce'];
const $ = (selector) => document.querySelector(selector);
const money = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function saveCart() { localStorage.setItem('paso-cart', JSON.stringify(state.cart)); updateCartCount(); }
function updateCartCount() { $('#cart-count').textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0); }
async function api(path, options = {}) {
  const response = await fetch(`/api/${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Ocurrió un error. Intenta de nuevo.');
  return payload;
}
async function initializeCart() {
  const previousCart = state.cart;
  try {
    let cart = await api(`orders/carts/${state.cartId}`);
    if (!cart.items.length && previousCart.length) {
      for (const item of previousCart) {
        await api(`orders/carts/${state.cartId}/items`, { method: 'PUT', body: JSON.stringify({ productId: item.productId, size: item.size, quantity: item.quantity }) });
      }
      cart = await api(`orders/carts/${state.cartId}`);
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
    const sizes = product.variants.filter((variant) => variant.stock > 0).map((variant) => variant.size);
    const tag = index === 0 ? 'MÁS ELEGIDO' : index === 2 ? 'NUEVO' : '';
    return `<article class="product-card">
      <div class="product-visual" style="--bubble:${palettes[index % palettes.length]}">
        ${tag ? `<span class="product-badge">${tag}</span>` : ''}<button class="product-image-trigger" data-open-product="${escapeHtml(product.id)}" aria-label="Ver ${escapeHtml(product.name)}"><span class="product-emoji" aria-hidden="true">${product.image}</span></button>
        <button class="quick-add" data-add="${escapeHtml(product.id)}" aria-label="Elegir talla de ${escapeHtml(product.name)}">+</button>
      </div>
      <div class="product-info"><div class="product-meta"><span>${escapeHtml(product.brand)}</span><span>★ 4.9</span></div><h3 class="product-name">${escapeHtml(product.name)}</h3><div class="product-bottom"><span class="product-price">${money(product.price)}</span><span class="product-sizes">Tallas ${sizes.slice(0, 4).join(' · ')}</span></div></div>
    </article>`;
  }).join('');
}
async function loadProducts() {
  $('#catalog-status').textContent = 'Buscando tu próximo par…';
  const params = new URLSearchParams(); if (state.category) params.set('category', state.category); if (state.size) params.set('size', state.size); if (state.search) params.set('search', state.search);
  try { const data = await api(`products?${params}`); state.products = data.products; renderProducts(); }
  catch (error) { $('#catalog-status').textContent = error.message; $('#product-grid').innerHTML = ''; }
}
async function addToCart(product, size) {
  await cartReady;
  const existing = state.cart.find((item) => item.productId === product.id && item.size === String(size));
  const quantity = (existing?.quantity || 0) + 1;
  try {
    const cart = await api(`orders/carts/${state.cartId}/items`, { method: 'PUT', body: JSON.stringify({ productId: product.id, size: String(size), quantity }) });
    state.cart = cart.items; saveCart(); showToast(`${product.name}, talla ${size}, guardado en tu bolsa.`);
  } catch (error) { showToast(error.message); }
}
function openProduct(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) return;
  const options = product.variants.filter((variant) => variant.stock > 0).map((variant) => `<option value="${variant.size}">${variant.size} · ${variant.stock} disponibles</option>`).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">Tu próximo par</h2><button class="close-modal" data-dismiss="true" aria-label="Cerrar">×</button></div><div class="product-visual" style="--bubble:${palettes[state.products.indexOf(product) % palettes.length]};height:220px"><span class="product-emoji">${product.image}</span></div><div class="product-info"><div class="product-meta"><span>${escapeHtml(product.brand)} · ${escapeHtml(product.category)}</span><span>★ 4.9</span></div><h3 class="product-name" style="font-size:22px">${escapeHtml(product.name)}</h3><p class="auth-copy">${escapeHtml(product.description)}</p><div class="product-price" style="font-size:15px;margin:15px 0">${money(product.price)}</div><label class="field"><span>Elige tu talla</span><select id="product-size">${options}</select></label><button id="add-selected" class="button button-dark full-button">Agregar a la bolsa <span>↗</span></button><p class="secure-note">Envío gratis desde $350.000 · Cambios fáciles hasta 30 días.</p></div></section></div>`;
  $('#add-selected').addEventListener('click', async () => { const size = $('#product-size').value; if (!size) return showToast('No hay tallas disponibles por ahora.'); await addToCart(product, size); closeModal(); });
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function openCart() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = state.cart.map((item, index) => `<div class="cart-line"><div class="cart-thumb">${item.image}</div><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.brand || '')} · Talla ${escapeHtml(item.size)}</p><div class="quantity-control"><button data-qty="${index}" data-delta="-1" aria-label="Restar">−</button><span>${item.quantity}</span><button data-qty="${index}" data-delta="1" aria-label="Sumar">+</button><button class="remove-line" data-remove="${index}">Quitar</button></div></div><span class="cart-line-price">${money(item.price * item.quantity)}</span></div>`).join('');
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
      const order = await api('orders', { method: 'POST', body: JSON.stringify({ cartId: state.cartId, customerName: form.get('customerName'), customerEmail: form.get('customerEmail') }) });
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
    try { const result = await api(`users/${registering ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(payload) }); state.user = result.user; localStorage.setItem('paso-user', JSON.stringify(result.user)); localStorage.setItem('paso-token', result.token); closeModal(); showToast(`¡Hola, ${result.user.name.split(' ')[0]}!`); }
    catch (error) { showToast(error.message); }
  });
}

$('#product-grid').addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  if (addButton) { event.stopPropagation(); openProduct(addButton.dataset.add); return; }
  const card = event.target.closest('[data-open-product]'); if (card) openProduct(card.dataset.openProduct);
});
$('#product-grid').addEventListener('keydown', (event) => { if (event.key === 'Enter' && event.target.matches('[data-open-product]')) openProduct(event.target.dataset.openProduct); });
$('.category-tabs').addEventListener('click', (event) => { const button = event.target.closest('[data-category]'); if (!button) return; state.category = button.dataset.category; document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('selected', tab === button)); loadProducts(); });
let searchTimer; $('#search-input').addEventListener('input', (event) => { clearTimeout(searchTimer); state.search = event.target.value.trim(); searchTimer = setTimeout(loadProducts, 220); });
$('#size-filter').addEventListener('change', (event) => { state.size = event.target.value; loadProducts(); });
$('#clear-filters').addEventListener('click', () => { state.category = ''; state.size = ''; state.search = ''; $('#search-input').value = ''; $('#size-filter').value = ''; document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('selected', tab.dataset.category === '')); loadProducts(); });
document.querySelectorAll('[data-category-link]').forEach((link) => link.addEventListener('click', () => { state.category = link.dataset.categoryLink; document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('selected', tab.dataset.category === state.category)); loadProducts(); }));
$('#cart-button').addEventListener('click', async () => { await cartReady; openCart(); }); $('#account-button').addEventListener('click', openAccount);
$('#menu-button').addEventListener('click', () => $('.main-nav').classList.toggle('open'));
$('#modal-root').addEventListener('click', (event) => {
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
    const path = `orders/carts/${state.cartId}/items/${encodeURIComponent(item.productId)}/${encodeURIComponent(item.size)}`;
    const cart = quantity <= 0
      ? await api(path, { method: 'DELETE' })
      : await api(`orders/carts/${state.cartId}/items`, { method: 'PUT', body: JSON.stringify({ productId: item.productId, size: item.size, quantity }) });
    state.cart = cart.items; saveCart(); openCart();
  } catch (error) { showToast(error.message); }
}
updateCartCount(); loadProducts();
const cartReady = initializeCart();


