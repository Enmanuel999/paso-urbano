import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { catalogApi } from '../../public/modules/api/catalog-api.js';
import { ordersApi } from '../../public/modules/api/orders-api.js';
import { usersApi } from '../../public/modules/api/users-api.js';
import { formatCurrency } from '../../public/modules/utils/formatters.js';

const palettes = ['#dfe4ca', '#e5dbce', '#d6dfdc', '#e3dccb', '#e8dfcf', '#d8ddc9', '#dcded5', '#e4ddce'];
const featuredIds = ['retro-court', 'urbano-nova', 'canvas-sun', 'daily-cloud'];
const featuredDetails = {
  'retro-court': ['90', 'Amortiguación Air · Estilo icónico', 'Movimiento natural'],
  'urbano-nova': ['AF1', 'Un clásico · Actitud urbana', 'Un ícono de la calle'],
  'canvas-sun': ['OG', 'Archivo deportivo · Estilo atemporal', 'Clásico dentro y fuera de cancha'],
  'daily-cloud': ['1', 'Herencia basketball · Perfil bajo', 'Historia en cada paso'],
};
const money = formatCurrency;
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

export default function App() {
  const [products, setProducts] = useState([]);
  const [cache, setCache] = useState({});
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [cart, setCart] = useState(readJson('paso-cart', []));
  const [favorites, setFavorites] = useState(() => new Set(readJson('paso-favorites', [])));
  const [cartId] = useState(() => { const value = localStorage.getItem('paso-cart-id') || crypto.randomUUID(); localStorage.setItem('paso-cart-id', value); return value; });
  const [user, setUser] = useState(readJson('paso-user', null));
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = useRef();
  const cartReady = useRef(Promise.resolve());
  const productsRef = useRef(products); productsRef.current = products;
  const favoritesRef = useRef(favorites); favoritesRef.current = favorites;
  const heroProducts = useMemo(() => featuredIds.map((id) => products.find((p) => p.id === id) || cache[id]).filter(Boolean), [products, cache]);
  const featured = heroProducts[heroIndex] || heroProducts[0];
  const cartCount = cart.reduce((n, item) => n + item.quantity, 0);
  const showToast = useCallback((message) => { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2600); }, []);

  useEffect(() => { localStorage.setItem('paso-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('paso-favorites', JSON.stringify([...favorites])); }, [favorites]);
  useEffect(() => { if (user) localStorage.setItem('paso-user', JSON.stringify(user)); else localStorage.removeItem('paso-user'); }, [user]);
  useEffect(() => { document.body.style.overflow = modal ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [modal]);

  const loadProducts = useCallback(async (filters = {}) => {
    setLoading(true); setCatalogError('');
    try {
      const data = await catalogApi.listProducts({ category, size, search: search.trim(), ...filters });
      setProducts(data.products || []);
      setCache((old) => ({ ...old, ...Object.fromEntries((data.products || []).map((p) => [p.id, p])) }));
    } catch (error) { setCatalogError(error.message); setProducts([]); }
    finally { setLoading(false); }
  }, [category, size, search]);
  useEffect(() => { const timer = setTimeout(() => loadProducts(), search ? 250 : 0); return () => clearTimeout(timer); }, [loadProducts]);

  useEffect(() => {
    let cancelled = false;
    const previous = readJson('paso-cart', []);
    cartReady.current = ordersApi.getCart(cartId).then(async (remote) => {
      let value = remote;
      if (!remote.items?.length && previous.length) {
        for (const item of previous) await ordersApi.setCartItem(cartId, { productId: item.productId, size: item.size, quantity: item.quantity });
        value = await ordersApi.getCart(cartId);
      }
      if (!cancelled) setCart(value.items || []);
    }).catch((error) => { if (!cancelled) showToast(`No se pudo sincronizar la bolsa: ${error.message}`); });
    return () => { cancelled = true; };
  }, [cartId, showToast]);

  useEffect(() => {
    if (heroPaused || heroProducts.length < 2) return undefined;
    const timer = setInterval(() => {
      const panel = document.getElementById('hero-product-panel');
      if (!document.hidden && !panel?.matches(':hover') && !panel?.querySelector('.hero-slide-tab:focus-visible')) setHeroIndex((i) => (i + 1) % heroProducts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroPaused, heroProducts.length]);

  const toggleFavorite = (id) => {
    const wasFavorite = favoritesRef.current.has(id);
    setFavorites((old) => { const next = new Set(old); wasFavorite ? next.delete(id) : next.add(id); return next; });
    showToast(wasFavorite ? 'Quitaste el par de tus favoritos.' : 'Par guardado en tus favoritos. No se agregó a la bolsa.');
  };
  const getProduct = (id) => productsRef.current.find((p) => p.id === id) || cache[id];
  const addToCart = async (product, chosenSize) => {
    await cartReady.current;
    const existing = cart.find((item) => item.productId === product.id && String(item.size) === String(chosenSize));
    try {
      const result = await ordersApi.setCartItem(cartId, { productId: product.id, size: String(chosenSize), quantity: (existing?.quantity || 0) + 1 });
      setCart(result.items || []); showToast(`${product.name}, talla ${chosenSize}, guardado en tu bolsa.`); setModal(null);
    } catch (error) { showToast(error.message); }
  };
  const openProduct = (id) => { const product = getProduct(id); if (product) setModal({ type: 'product', product, imageIndex: 0 }); };
  const openFavorites = async () => {
    const missing = [...favoritesRef.current].some((id) => !getProduct(id));
    if (missing) { try { const result = await catalogApi.listProducts(); setCache((old) => ({ ...old, ...Object.fromEntries(result.products.map((p) => [p.id, p])) })); } catch (error) { showToast(`No se pudieron cargar tus favoritos: ${error.message}`); } }
    setModal({ type: 'favorites' });
  };
  const openCart = async () => { await cartReady.current; setModal({ type: 'cart' }); };
  const updateCart = async (item, quantity) => {
    try {
      const result = quantity < 1
        ? await ordersApi.removeCartItem(cartId, item.productId, item.size)
        : await ordersApi.setCartItem(cartId, { productId: item.productId, size: item.size, quantity });
      setCart(result.items || []);
    } catch (error) { showToast(error.message); }
  };
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 350000 || subtotal === 0 ? 0 : 14000;
  const openAuth = () => setModal({ type: 'account', mode: 'login' });
  const goCategory = (value) => { setCategory(value); setMenuOpen(false); document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' }); };

  return <>
    <div className="announcement">Envío gratis en compras superiores a $350.000 <span>·</span> Cambios fáciles por 30 días</div>
    <header className="site-header">
      <a className="brand" href="#inicio" aria-label="Paso Urbano, inicio"><img className="brand-mark" src="/images/paso-urbano-mark.svg" alt=""/><span>PASO<span className="brand-light">URBANO</span></span></a>
      <nav className={`main-nav${menuOpen ? ' open' : ''}`} aria-label="Navegación principal"><a className="active" href="#coleccion" onClick={() => setMenuOpen(false)}>Tienda</a><a href="#coleccion" onClick={() => goCategory('Deportivo')}>Deportivos</a><a href="#coleccion" onClick={() => goCategory('Casual')}>Casuales</a><a href="#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</a></nav>
      <div className="header-actions"><button className="icon-button account-button" aria-label="Mi cuenta" onClick={openAuth}><span className="outline-icon">♙</span><span className="account-label">{user ? user.name.split(' ')[0] : 'Mi cuenta'}</span></button><button className="icon-button favorites-button" aria-label="Abrir favoritos" onClick={openFavorites}><span className="outline-icon favorite-header-icon">♡</span><span className="favorites-label">Favoritos</span><span className="favorites-count">{favorites.size}</span></button><button className="icon-button cart-button" aria-label="Abrir bolsa" onClick={openCart}><span className="outline-icon">▱</span><span className="cart-label">Bolsa</span><span className="cart-count">{cartCount}</span></button><button className="menu-button" aria-label="Abrir menú" onClick={() => setMenuOpen((v) => !v)}>☰</button></div>
    </header>
    <main id="inicio">
      <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"/> NUEVA TEMPORADA · 2026</p><h1>Camina<br/>a tu <em>ritmo.</em></h1><p className="hero-description">Zapatos que acompañan cada versión de ti. Encuentra el par que cuenta tu historia.</p><a className="button button-dark" href="#coleccion">Explorar colección <span>↗</span></a><div className="hero-footnote"><span className="tiny-stars">★★★★★</span><span>4.9/5 · Más de 2.400 pasos felices</span></div></div>
        <div className="hero-art" id="hero-product-panel" role="tabpanel" aria-labelledby={`hero-tab-${heroIndex}`} tabIndex="0"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-sun"/><span className="hero-edition">{featured ? (featuredDetails[featured.id]?.[0] || '01') : '90'}</span>{featured && <img className="hero-shoe" src={featured.image} alt={`${featured.brand} ${featured.name}`} role="button" tabIndex="0" onClick={() => openProduct(featured.id)} onKeyDown={(e) => e.key === 'Enter' && openProduct(featured.id)} fetchPriority="high"/>}<div className="hero-spark spark-one">✳</div><div className="hero-spark spark-two">✦</div><div className="hero-model-label"><span>MODELO DESTACADO</span><strong>{featured ? `${featured.brand} ${featured.name}` : 'Paso Urbano'}</strong><small>{featured ? featuredDetails[featured.id]?.[1] || 'Un nuevo favorito · Paso Urbano' : 'Descubre la colección'}</small><button className="hero-view-product" onClick={() => featured && openProduct(featured.id)}>Ver detalles <span>↗</span></button></div><div className="hero-caption"><div className="hero-slide-tabs" role="tablist" aria-label="Seleccionar par destacado">{heroProducts.map((product, index) => <button key={product.id} className={`hero-slide-tab${index === heroIndex ? ' selected' : ''}`} id={`hero-tab-${index}`} type="button" role="tab" aria-selected={index === heroIndex} aria-controls="hero-product-panel" tabIndex={index === heroIndex ? 0 : -1} aria-label={`Mostrar ${product.brand} ${product.name}`} onClick={() => setHeroIndex(index)} onKeyDown={(event) => { if (['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? heroProducts.length - 1 : (heroIndex + (event.key === 'ArrowRight' ? 1 : -1) + heroProducts.length) % heroProducts.length; setHeroIndex(next); document.getElementById(`hero-tab-${next}`)?.focus(); } }}>{String(index + 1).padStart(2, '0')}</button>)}</div><span className="caption-divider"/><span>{featured ? featuredDetails[featured.id]?.[2] || 'Encuentra tu próximo par' : 'Movimiento natural'}</span><button className="hero-carousel-toggle" type="button" aria-label={heroPaused ? 'Reanudar carrusel automático' : 'Pausar carrusel automático'} onClick={() => setHeroPaused((v) => !v)}>{heroPaused ? '▶' : 'Ⅱ'}</button></div><div className="hero-tag"><span className="tag-dot"/> NUEVA COLECCIÓN</div></div>
      </section>
      <section className="benefits" aria-label="Ventajas de comprar en Paso Urbano"><div><span className="benefit-icon">↗</span><span><b>Envío gratis</b><small>Desde $350.000</small></span></div><div><span className="benefit-icon">⟳</span><span><b>Cambios fáciles</b><small>Hasta 30 días</small></span></div><div><span className="benefit-icon">♡</span><span><b>Compra segura</b><small>Pago protegido</small></span></div><div><span className="benefit-icon">✳</span><span><b>Hechos para ti</b><small>Comodidad real</small></span></div></section>
      <section id="coleccion" className="collection section-wrap"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line"/> HECHOS PARA MOVERTE</p><h2>Encuentra tu <em>par.</em></h2></div><a className="text-link desktop-link" href="#coleccion">Ver toda la colección <span>↗</span></a></div>
        <div className="collection-tools"><div className="category-tabs" role="group" aria-label="Filtrar por categoría">{[['','Todos'],['Urbano','Urbano'],['Deportivo','Deportivo'],['Casual','Casual'],['Outdoor','Outdoor']].map(([value,label],i)=><button key={value} className={`filter-tab${category===value?' selected':''}`} onClick={()=>setCategory(value)}>{label}{i===0&&<span>{String(products.length).padStart(2,'0')}</span>}</button>)}</div><div className="filter-controls"><label className="search-box"><span>⌕</span><input type="search" placeholder="Buscar zapatos" aria-label="Buscar zapatos" value={search} onChange={(e)=>setSearch(e.target.value)}/></label><label className="size-filter"><span>Talla</span><select aria-label="Filtrar por talla" value={size} onChange={(e)=>setSize(e.target.value)}><option value="">Todas</option>{[35,36,37,38,39,40,41,42].map((n)=><option key={n}>{n}</option>)}</select></label></div></div>
        <div className="catalog-status" aria-live="polite">{loading?'Buscando tu próximo par…':catalogError||`${products.length} ${products.length===1?'par disponible':'pares disponibles'}`}</div>{!loading&&!catalogError&&products.length>0&&<div className="product-grid">{products.map((product,index)=>{const sizes=product.variants.filter((v)=>v.stock>0).map((v)=>v.size);const saved=favorites.has(product.id);return <article className="product-card" key={product.id}><div className="product-visual" style={{'--bubble':palettes[index%palettes.length]}}>{(index===0||index===2)&&<span className="product-badge">{index===0?'MÁS ELEGIDO':'NUEVO'}</span>}<button className={`favorite-toggle${saved?' is-favorite':''}`} data-tooltip={saved?'Quitar de favoritos':'Agregar a favoritos'} aria-label={`${saved?'Quitar':'Agregar'} ${product.name} ${saved?'de':'a'} favoritos`} aria-pressed={saved} onClick={()=>toggleFavorite(product.id)}><span>{saved?'♥':'♡'}</span></button><button className="product-image-trigger" aria-label={`Ver ${product.name}`} onClick={()=>openProduct(product.id)}><img className="product-photo" src={product.image} alt={product.name} loading="lazy" decoding="async"/></button><button className="quick-add" data-tooltip="Elegir talla y agregar al carrito" aria-label={`Elegir talla de ${product.name} para agregarlo al carrito`} onClick={()=>openProduct(product.id)}><span>+</span></button></div><div className="product-info"><div className="product-meta"><span>{product.brand}</span><span>★ 4.9</span></div><h3 className="product-name">{product.name}</h3><div className="product-bottom"><span className="product-price">{money(product.price)}</span><span className="product-sizes">Tallas {sizes.slice(0,4).join(' · ')}</span></div></div></article>;})}</div>}
        {!loading&&!catalogError&&!products.length&&<div className="empty-state"><span>◌</span><h3>No encontramos ese par</h3><p>Prueba otra búsqueda o cambia los filtros.</p><button className="text-link" onClick={()=>{setCategory('');setSize('');setSearch('');}}>Limpiar filtros</button></div>}<div className="mobile-all"><a className="button button-outline" href="#coleccion">Ver colección completa <span>↗</span></a></div>
      </section>
      <section className="story" id="nosotros"><div className="story-art"><div className="story-circle"/><span className="story-shoe">👟</span><span className="story-stamp">PASO<br/>A PASO<br/><b>COLOMBIA</b></span></div><div className="story-copy"><p className="eyebrow"><span className="eyebrow-line"/> NUESTRO MANIFIESTO</p><h2>Más que llegar.<br/><em>Disfrutar el camino.</em></h2><p>Creemos que cada paso merece sentirse bien. Elegimos materiales cómodos, diseños versátiles y detalles que te siguen el ritmo, desde el primer café hasta el último plan.</p><a className="text-link" href="#coleccion">Conoce la colección <span>↗</span></a></div></section>
      <section className="newsletter"><div><p className="eyebrow">UN PASO ADELANTE</p><h2>Buenas cosas<br/>vienen en camino.</h2><p>Suscríbete y recibe novedades, lanzamientos y un 10% en tu primera compra.</p></div><form className="newsletter-form" onSubmit={(e)=>{e.preventDefault();showToast('¡Gracias por suscribirte a Paso Urbano!');e.currentTarget.reset();}}><label htmlFor="newsletter-email">Tu correo electrónico</label><div className="newsletter-input"><input id="newsletter-email" type="email" placeholder="hola@correo.com" required/><button type="submit" aria-label="Suscribirme">→</button></div><small>Al suscribirte aceptas nuestra política de privacidad.</small></form><span className="newsletter-spark">✳</span></section>
    </main>
    <footer className="site-footer"><div className="footer-top"><a className="brand brand-footer" href="#inicio"><img className="brand-mark" src="/images/paso-urbano-mark.svg" alt=""/><span>PASO<span className="brand-light">URBANO</span></span></a><p>Haz que cada paso cuente.</p><div className="socials"><a href="#inicio" aria-label="Instagram">ig</a><a href="#inicio" aria-label="TikTok">tk</a><a href="#inicio" aria-label="Facebook">f</a></div></div><div className="footer-bottom"><span>© 2026 Paso Urbano. Hecho para moverte.</span><span>Colombia · COP $</span><span><a href="#nosotros">Privacidad</a><a href="#nosotros">Ayuda</a><a href="/admin.html">Administración</a></span></div></footer>
    <div className={`toast${toast?' show':''}`} role="status" aria-live="polite">{toast}</div>
    {modal&&<Modal modal={modal} setModal={setModal} products={products} cache={cache} favorites={favorites} toggleFavorite={toggleFavorite} openProduct={openProduct} showToast={showToast} cart={cart} cartId={cartId} cartReady={cartReady} setCart={setCart} updateCart={updateCart} subtotal={subtotal} shipping={shipping} user={user} setUser={setUser} loadProducts={loadProducts}/>}
  </>;
}

function Modal({modal,setModal,products,cache,favorites,toggleFavorite,openProduct,showToast,cart,cartId,cartReady,setCart,updateCart,subtotal,shipping,user,setUser,loadProducts}) {
  const [imageIndex,setImageIndex]=useState(modal.imageIndex||0);
  const [authMode,setAuthMode]=useState(modal.mode||'login');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const close=()=>setModal(null);
  const product=modal.product;
  const images=product?[{src:product.image,alt:`${product.name} — foto principal`},...(product.images||[])]:[];
  const setGallery=(src)=>setImageIndex(Math.max(0,images.findIndex((image)=>image.src===src)));
  const submitAuth=async(e)=>{e.preventDefault();setBusy(true);setError('');const data=Object.fromEntries(new FormData(e.currentTarget));try{const result=authMode==='register'?await usersApi.register(data):await usersApi.login(data);setUser(result.user);localStorage.setItem('paso-token',result.token);close();showToast(`¡Hola, ${result.user.name.split(' ')[0]}!`);}catch(err){setError(err.message);}finally{setBusy(false);}};
  const checkout=async(e)=>{e.preventDefault();setBusy(true);setError('');const data=Object.fromEntries(new FormData(e.currentTarget));try{await cartReady.current;const order=await ordersApi.createOrder({cartId,customerName:data.customerName,customerEmail:data.customerEmail});setCart([]);localStorage.setItem('paso-cart','[]');setModal({type:'success',order});loadProducts();}catch(err){setError(err.message);setBusy(false);}};
  const removeFavorite=(id)=>{toggleFavorite(id);};
  let content;
  if(modal.type==='product'&&product){content=<><div className="modal-head"><h2 id="modal-title">Tu próximo par</h2><button className="close-modal" onClick={close} aria-label="Cerrar">×</button></div><div className="product-visual product-detail-visual" style={{'--bubble':palettes[Math.max(0,products.findIndex((p)=>p.id===product.id))%palettes.length]}}><img className="product-photo" src={images[imageIndex]?.src||product.image} alt={images[imageIndex]?.alt||product.name} decoding="async"/></div>{images.length>1&&<div className="product-gallery-thumbnails" role="group" aria-label={`Galería de ${product.name}`}>{images.map((image,index)=><button key={image.src} className={`gallery-thumb${index===imageIndex?' selected':''}`} type="button" aria-label={`Mostrar foto ${index+1} de ${images.length}`} aria-pressed={index===imageIndex} onClick={()=>setImageIndex(index)}><img src={image.src} alt="" loading="lazy"/></button>)}</div>}<div className="product-info"><div className="product-meta"><span>{product.brand} · {product.category}</span><span>★ 4.9</span></div><h3 className="product-name" style={{fontSize:22}}>{product.name}</h3><p className="auth-copy">{product.description}</p><div className="product-price" style={{fontSize:15,margin:'15px 0'}}>{money(product.price)}</div><button className={`favorite-detail-toggle${favorites.has(product.id)?' is-favorite':''}`} aria-pressed={favorites.has(product.id)} onClick={()=>toggleFavorite(product.id)}>{favorites.has(product.id)?'♥ Guardado en favoritos':'♡ Guardar en favoritos'}</button><label className="field"><span>Elige tu talla</span><select id="product-size" defaultValue="">{product.variants.filter((v)=>v.stock>0).map((v)=><option key={v.size} value={v.size}>{v.size} · {v.stock} disponibles</option>)}</select></label><button className="button button-dark full-button" onClick={()=>{const size=document.getElementById('product-size')?.value;if(!size)return showToast('No hay tallas disponibles por ahora.');(async()=>{await cartReady.current;const existing=cart.find((i)=>i.productId===product.id&&String(i.size)===String(size));try{const result=await ordersApi.setCartItem(cartId,{productId:product.id,size:String(size),quantity:(existing?.quantity||0)+1});setCart(result.items||[]);showToast(`${product.name}, talla ${size}, guardado en tu bolsa.`);close();}catch(err){showToast(err.message);}})();}}>Agregar a la bolsa <span>↗</span></button><p className="secure-note">Envío gratis desde $350.000 · Cambios fáciles hasta 30 días.</p></div></>;
  } else if(modal.type==='favorites') {const saved=[...favorites].map((id)=>products.find((p)=>p.id===id)||cache[id]).filter(Boolean);content=<><div className="modal-head"><div><h2 id="modal-title">Tus favoritos</h2><p className="favorites-intro">Tus pares guardados, sin agregarlos a la bolsa.</p></div><button className="close-modal" onClick={close} aria-label="Cerrar">×</button></div>{saved.length?<div className="favorites-list">{saved.map((p)=><article className="favorite-card" key={p.id}><button className="favorite-card-image" onClick={()=>openProduct(p.id)} aria-label={`Ver ${p.name}`}><img src={p.image} alt={p.name}/></button><div className="favorite-card-copy"><span>{p.brand}</span><h3>{p.name}</h3><strong>{money(p.price)}</strong><button className="favorite-remove" onClick={()=>removeFavorite(p.id)}>Quitar de favoritos</button></div><button className="favorite-card-open" onClick={()=>openProduct(p.id)} aria-label={`Detalles de ${p.name}`}>↗</button></article>)}</div>:<div className="favorites-empty"><span>♡</span><h3>Aún no guardas ningún par</h3><p>Toca el corazón de un zapato para tenerlo a mano. No se agregará a tu bolsa.</p><button className="button button-dark full-button" onClick={close}>Explorar la colección <span>↗</span></button></div>}</>;
  } else if(modal.type==='cart') {content=<><div className="modal-head"><h2 id="modal-title">Tu bolsa <span style={{font:'11px Arial',color:'#899187'}}>({cart.length})</span></h2><button className="close-modal" onClick={close} aria-label="Cerrar">×</button></div>{cart.length?<><div>{cart.map((item)=><div className="cart-line" key={`${item.productId}-${item.size}`}><div className="cart-thumb"><img src={item.image} alt={item.name}/></div><div><h3>{item.name}</h3><p>{item.brand||''} · Talla {item.size}</p><div className="quantity-control"><button onClick={()=>updateCart(item,item.quantity-1)} aria-label="Restar">−</button><span>{item.quantity}</span><button onClick={()=>updateCart(item,item.quantity+1)} aria-label="Sumar">+</button><button className="remove-line" onClick={()=>updateCart(item,0)}>Quitar</button></div></div><span className="cart-line-price">{money(item.price*item.quantity)}</span></div>)}</div><div className="cart-summary"><div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>Envío</span><span>{shipping?money(shipping):'Gratis'}</span></div><div className="summary-row total"><span>Total estimado</span><span>{money(subtotal+shipping)}</span></div><p className="cart-note">El envío se confirma al completar tu pedido. Pago de demostración, sin datos bancarios.</p><button className="button button-dark full-button" onClick={()=>setModal({type:'checkout'})}>Continuar con mi compra <span>↗</span></button></div></>:<div className="cart-empty"><span>▱</span><h3>Tu bolsa está esperando</h3><p>Encuentra ese par que va contigo.</p><button className="button button-dark" onClick={close}>Explorar zapatos <span>↗</span></button></div>}</>;
  } else if(modal.type==='account') {content=<><div className="modal-head"><h2 id="modal-title">{user?'Mi cuenta':authMode==='register'?'Únete a Paso Urbano':'Qué bueno verte'}</h2><button className="close-modal" onClick={close} aria-label="Cerrar">×</button></div>{user?<div className="order-success"><span className="success-mark">{user.name?.[0]?.toUpperCase()}</span><h3>Hola, {user.name?.split(' ')[0]}</h3><p>{user.email}</p><button className="button button-outline full-button" onClick={()=>{setUser(null);localStorage.removeItem('paso-token');close();showToast('Sesión cerrada.');}}>Cerrar sesión</button></div>:<><div className="auth-tabs"><button className={`auth-tab${authMode==='login'?' selected':''}`} onClick={()=>setAuthMode('login')}>Iniciar sesión</button><button className={`auth-tab${authMode==='register'?' selected':''}`} onClick={()=>setAuthMode('register')}>Crear cuenta</button></div><p className="auth-copy">{authMode==='register'?'Guarda tus datos y sigue cada pedido.':'Inicia sesión para tener tus compras a mano.'}</p><form onSubmit={submitAuth}>{authMode==='register'&&<label className="field"><span>Nombre</span><input name="name" autoComplete="name" required minLength="2" placeholder="Tu nombre"/></label>}<label className="field"><span>Correo electrónico</span><input type="email" name="email" autoComplete="email" required placeholder="hola@correo.com"/></label><label className="field"><span>Contraseña</span><input type="password" name="password" autoComplete={authMode==='register'?'new-password':'current-password'} required minLength="8" placeholder="Mínimo 8 caracteres"/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-dark full-button" disabled={busy}>{busy?'Procesando…':authMode==='register'?'Crear cuenta':'Iniciar sesión'} <span>↗</span></button></form></>}</>;
  } else if(modal.type==='checkout') {content=<><div className="modal-head"><h2 id="modal-title">Finalizar pedido</h2><button className="close-modal" onClick={close} aria-label="Cerrar">×</button></div><p className="auth-copy">Un último paso para estrenar tu nuevo par.</p><form className="checkout-form" onSubmit={checkout}><label className="field"><span>Nombre de quien recibe</span><input name="customerName" autoComplete="name" required minLength="2" defaultValue={user?.name||''} placeholder="Tu nombre"/></label><label className="field"><span>Correo electrónico</span><input name="customerEmail" type="email" autoComplete="email" required defaultValue={user?.email||''} placeholder="hola@correo.com"/></label><div className="secure-note">✓ Pago de demostración. No solicitamos información de tarjetas.</div><div className="summary-row total"><span>Total estimado</span><span>{money(subtotal+shipping)}</span></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-dark full-button" disabled={busy}>{busy?'Confirmando…':'Confirmar pedido'} <span>↗</span></button></form></>;
  } else {const order=modal.order;content=<><div className="modal-head"><a className="brand" href="#inicio" onClick={close}><span>PASO<span className="brand-light">URBANO</span></span></a><button className="close-modal" onClick={close} aria-label="Cerrar">×</button></div><div className="order-success"><span className="success-mark">✓</span><h3>¡Tu pedido está listo!</h3><p>Gracias, {order.customer_name}. Tu compra quedó registrada para {order.customer_email}.</p><div className="order-code">{order.id}</div><p>Estado: {order.status} · Pago: {order.payment_status}</p><button className="button button-dark full-button" onClick={close}>Seguir explorando <span>↗</span></button></div></>;}
  return <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)close();}}><section className={`modal-panel${modal.type==='favorites'?' favorites-panel':''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">{content}</section></div>;
}
