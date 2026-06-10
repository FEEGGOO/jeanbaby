/* Jean Baby – SPA App */
'use strict';

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════
const App = {
  user: null,
  cartCount: 0,
  currentPage: null,
};

const RATINGS = [4.8,4.9,4.7,4.6,4.5,4.8,4.9,4.7];
const REVIEWS  = [124,203,456,312,89,178,234,98];
const fakeRating  = id => RATINGS[id % RATINGS.length];
const fakeReviews = id => REVIEWS[id % REVIEWS.length];
const fmtPrice = n => Number(n).toLocaleString() + ' RWF';
const fmtDate  = d => new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});

// ═══════════════════════════════════════════════
//  API HELPER
// ═══════════════════════════════════════════════
async function api(method, url, body) {
  const opts = { method, headers: {}, credentials: 'include' };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ═══════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════
function toast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = `${icons[type]} ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ═══════════════════════════════════════════════
//  ROUTER
// ═══════════════════════════════════════════════
const routes = {
  '/'            : showHome,
  '/products'    : showProducts,
  '/product'     : showProductDetail,
  '/cart'        : showCart,
  '/checkout'    : showCheckout,
  '/confirmation': showConfirmation,
  '/orders'      : showOrders,
  '/login'       : showLogin,
  '/register'    : showRegister,
  '/about'       : showAbout,
  '/contact'     : showContact,
  '/seller'      : showSeller,
};

function navigate(path, pushState = true) {
  if (pushState) history.pushState({}, '', path);
  const base = '/' + path.split('/')[1].split('?')[0];
  const handler = routes[base] || routes['/'];
  handler(path);
}

window.addEventListener('popstate', () => navigate(location.pathname + location.search, false));

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');
  App.currentPage = id;
  window.scrollTo(0, 0);
  updateNavActiveState(id);
}

function updateNavActiveState(id) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
  const map = { home: 'nav-home', products: 'nav-products', about: 'nav-about', contact: 'nav-contact' };
  const bmap = { home: 'bnav-home', products: 'bnav-products', cart: 'bnav-cart', orders: 'bnav-orders' };
  if (map[id]) document.getElementById(map[id])?.classList.add('active');
  if (bmap[id]) document.getElementById(bmap[id])?.classList.add('active');
}

function handleAccountNav() {
  if (App.user) {
    if (App.user.role === 'seller') navigate('/seller');
    else navigate('/orders');
  } else {
    navigate('/login');
  }
}

// ═══════════════════════════════════════════════
//  NAV / AUTH STATE
// ═══════════════════════════════════════════════
async function initAuth() {
  try {
    const { user } = await api('GET', '/api/auth/me');
    App.user = user;
    renderNavAuth();
    if (user) await updateCartCount();
  } catch {}
}

function renderNavAuth() {
  const area = document.getElementById('nav-auth');
  if (App.user) {
    area.innerHTML = `
      <div style="position:relative">
        <button class="avatar-btn" id="avatar-btn">${App.user.names.charAt(0).toUpperCase()}</button>
        <div class="dropdown" id="user-dropdown">
          <div class="dropdown-header">
            <div class="dname">${App.user.names}</div>
            <div class="demail">${App.user.email}</div>
            <span class="drole">${App.user.role}</span>
          </div>
          <div class="dropdown-body">
            <div class="dropdown-item" onclick="navigate('/orders')">📦 My Orders</div>
            ${App.user.role === 'seller' ? `<div class="dropdown-item" onclick="navigate('/seller')">📊 Seller Dashboard</div>` : ''}
            <hr>
            <div class="dropdown-item danger" onclick="doLogout()">🚪 Sign Out</div>
          </div>
        </div>
      </div>`;
    document.getElementById('avatar-btn').addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('user-dropdown').classList.toggle('open');
    });
    document.addEventListener('click', () => document.getElementById('user-dropdown')?.classList.remove('open'));
  } else {
    area.innerHTML = `
      <button class="nav-icon-btn" onclick="navigate('/login')" title="Sign In">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </button>`;
  }
}

async function updateCartCount() {
  if (!App.user) {
    document.getElementById('cart-badge').style.display = 'none';
    const b = document.getElementById('bnav-cart-badge');
    if(b) b.style.display = 'none';
    return;
  }
  try {
    const items = await api('GET', '/api/cart');
    const total = items.reduce((s, i) => s + i.quantity, 0);
    App.cartCount = total;
    const badge = document.getElementById('cart-badge');
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
    const bnavBadge = document.getElementById('bnav-cart-badge');
    if (bnavBadge) {
      bnavBadge.textContent = total;
      bnavBadge.style.display = total > 0 ? 'flex' : 'none';
    }
  } catch {}
}

async function doLogout() {
  await api('POST', '/api/auth/logout');
  App.user = null;
  App.cartCount = 0;
  renderNavAuth();
  document.getElementById('cart-badge').style.display = 'none';
  toast('Signed out successfully');
  navigate('/');
}

// ═══════════════════════════════════════════════
//  HOME PAGE
// ═══════════════════════════════════════════════
async function showHome() {
  showPage('home');
  try {
    const { products } = await api('GET', '/api/products?limit=8');
    const cats = await api('GET', '/api/products/categories');
    renderCatPills(cats, 'home-cat-pills', null, (id) => { navigate('/products?category_id=' + id); });
    document.getElementById('home-products').innerHTML = products.map(productCardHTML).join('');
  } catch(e) { console.error(e); }
}

function productCardHTML(p) {
  return `
  <div class="product-card" onclick="navigate('/product?id=${p.id}')">
    <div class="product-card-img">
      <img src="${p.image_url || 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&q=80'}" alt="${esc(p.name)}" loading="lazy">
      <div class="cat-badge">${esc(p.category_name || 'General')}</div>
      <button class="wishlist-btn" onclick="event.stopPropagation()" title="Wishlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2" width="15" height="15"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </button>
    </div>
    <div class="product-card-body">
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-rating">
        <span class="star">★</span>
        <span class="rating-score">${fakeRating(p.id)}</span>
        <span class="rating-count">(${fakeReviews(p.id)})</span>
      </div>
      <div class="product-price">${fmtPrice(p.price)}</div>
      <div class="product-actions">
        <button class="btn-details" onclick="event.stopPropagation();navigate('/product?id=${p.id}')">Details</button>
        <button class="btn-add" onclick="event.stopPropagation();addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  </div>`;
}

function renderCatPills(cats, containerId, activeCatId, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="cat-pill ${!activeCatId ? 'active' : ''}" onclick="(${onSelect.toString()})(null)">All</div>` +
    cats.map(c => `<div class="cat-pill ${activeCatId == c.id ? 'active' : ''}" onclick="(${onSelect.toString()})(${c.id})">${esc(c.label)}</div>`).join('');
}

// ═══════════════════════════════════════════════
//  PRODUCTS PAGE
// ═══════════════════════════════════════════════
let productsState = { q: '', category_id: 0, page: 1 };

async function showProducts(path = '/products') {
  showPage('products');
  const params = new URLSearchParams(path.split('?')[1] || '');
  productsState.q           = params.get('q') || '';
  productsState.category_id = parseInt(params.get('category_id') || 0);
  productsState.page        = parseInt(params.get('page') || 1);
  document.getElementById('product-search').value = productsState.q;
  try {
    const cats = await api('GET', '/api/products/categories');
    renderCatPills(cats, 'products-cat-pills', productsState.category_id, (id) => {
      productsState.category_id = id || 0;
      productsState.page = 1;
      loadProducts();
    });
    await loadProducts();
  } catch(e) { console.error(e); }
}

async function loadProducts() {
  const { q, category_id, page } = productsState;
  const qs = new URLSearchParams({ q, page, limit: 12 });
  if (category_id) qs.set('category_id', category_id);
  try {
    const data = await api('GET', '/api/products?' + qs);
    const grid = document.getElementById('products-grid');
    if (!data.products.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h2>No products found</h2><p>Try a different search or category.</p></div>`;
    } else {
      grid.innerHTML = data.products.map(productCardHTML).join('');
    }
    renderPagination(data.page, data.pages, 'products-pagination');
    document.getElementById('products-count').textContent = `${data.total} products found`;
  } catch(e) { console.error(e); }
}

function renderPagination(current, total, containerId) {
  const el = document.getElementById(containerId);
  if (!el || total <= 1) { if(el) el.innerHTML = ''; return; }
  let html = '';
  if (current > 1) html += `<button class="page-btn" onclick="goPage(${current-1})">‹</button>`;
  for (let i = Math.max(1, current-2); i <= Math.min(total, current+2); i++)
    html += `<button class="page-btn ${i===current?'active':''}" onclick="goPage(${i})">${i}</button>`;
  if (current < total) html += `<button class="page-btn" onclick="goPage(${current+1})">›</button>`;
  el.innerHTML = html;
}

function goPage(p) { productsState.page = p; loadProducts(); }

// ═══════════════════════════════════════════════
//  PRODUCT DETAIL
// ═══════════════════════════════════════════════
let detailQty = 1;

async function showProductDetail(path) {
  showPage('detail');
  const id = new URLSearchParams(path.split('?')[1]).get('id');
  try {
    const p = await api('GET', '/api/products/' + id);
    document.getElementById('detail-breadcrumb').textContent = p.name;
    document.getElementById('detail-img').src       = p.image_url || 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80';
    document.getElementById('detail-img').alt       = p.name;
    document.getElementById('detail-cat').textContent   = p.category_name || 'General';
    document.getElementById('detail-name').textContent  = p.name;
    document.getElementById('detail-price').textContent = fmtPrice(p.price);
    document.getElementById('detail-desc').textContent  = p.description || '';
    document.getElementById('detail-stock').textContent = p.stock > 0 ? `In Stock (${p.stock} available)` : 'Out of Stock';
    document.getElementById('detail-rating').textContent = `★ ${fakeRating(p.id)} (${fakeReviews(p.id)} reviews)`;
    detailQty = 1;
    document.getElementById('detail-qty').textContent = 1;
    document.getElementById('btn-add-detail').onclick = () => addToCartQty(p.id, detailQty);
    document.getElementById('qty-minus').onclick = () => { detailQty = Math.max(1, detailQty-1); document.getElementById('detail-qty').textContent = detailQty; };
    document.getElementById('qty-plus').onclick  = () => { detailQty = Math.min(p.stock, detailQty+1); document.getElementById('detail-qty').textContent = detailQty; };
  } catch(e) { toast('Product not found', 'error'); navigate('/products'); }
}

// ═══════════════════════════════════════════════
//  CART
// ═══════════════════════════════════════════════
async function addToCart(productId) {
  if (!App.user) { toast('Please sign in to add items', 'error'); navigate('/login'); return; }
  try {
    await api('POST', '/api/cart', { product_id: productId, quantity: 1 });
    await updateCartCount();
    toast('Added to cart!');
  } catch(e) { toast(e.message, 'error'); }
}

async function addToCartQty(productId, qty) {
  if (!App.user) { toast('Please sign in to add items', 'error'); navigate('/login'); return; }
  try {
    await api('POST', '/api/cart', { product_id: productId, quantity: qty });
    await updateCartCount();
    toast(`${qty} item(s) added to cart!`);
    navigate('/cart');
  } catch(e) { toast(e.message, 'error'); }
}

async function showCart() {
  showPage('cart');
  if (!App.user) {
    document.getElementById('cart-content').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🔐</div><h2>Sign in to view your cart</h2>
        <button class="btn btn-pink btn-lg" onclick="navigate('/login')">Sign In</button>
      </div>`;
    return;
  }
  try {
    const items = await api('GET', '/api/cart');
    if (!items.length) {
      document.getElementById('cart-content').innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🛒</div><h2>Your cart is empty</h2>
          <p>Add some products to get started</p>
          <button class="btn btn-pink btn-lg" onclick="navigate('/products')">Browse Products</button>
        </div>`;
      return;
    }
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total    = subtotal + 2000;
    document.getElementById('cart-content').innerHTML = `
      <div>
        ${items.map(item => `
        <div class="cart-item">
          <img class="cart-item-img" src="${item.image_url || 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200&q=80'}" alt="${esc(item.name)}">
          <div class="cart-item-info">
            <div class="cart-item-name">${esc(item.name)}</div>
            <div class="cart-item-price">${fmtPrice(item.price * item.quantity)}</div>
          </div>
          <div class="cart-item-right">
            <button class="remove-btn" onclick="removeCartItem(${item.id})">🗑</button>
            <div class="qty-ctrl">
              <button onclick="updateCart(${item.id},${item.quantity - 1})">−</button>
              <span>${item.quantity}</span>
              <button onclick="updateCart(${item.id},${item.quantity + 1})">+</button>
            </div>
          </div>
        </div>`).join('')}
      </div>
      <div class="summary-card">
        <div class="summary-title">Order Summary</div>
        <div class="summary-row"><span>Subtotal (${items.length} items)</span><span>${fmtPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Delivery fee</span><span>${fmtPrice(2000)}</span></div>
        <div class="summary-total"><span>Total</span><span>${fmtPrice(total)}</span></div>
        <button class="btn btn-pink btn-block btn-lg" style="margin-top:20px" onclick="navigate('/checkout')">Proceed to Checkout →</button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--light)">🔒 Secure checkout</div>
      </div>`;
  } catch(e) { toast('Failed to load cart', 'error'); }
}

async function updateCart(itemId, qty) {
  try {
    await api('PUT', '/api/cart/' + itemId, { quantity: qty });
    await updateCartCount();
    showCart();
  } catch(e) { toast(e.message, 'error'); }
}

async function removeCartItem(itemId) {
  try {
    await api('DELETE', '/api/cart/' + itemId);
    await updateCartCount();
    showCart();
    toast('Item removed');
  } catch(e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════
//  CHECKOUT
// ═══════════════════════════════════════════════
async function showCheckout() {
  if (!App.user) { navigate('/login'); return; }
  showPage('checkout');
  try {
    const items = await api('GET', '/api/cart');
    if (!items.length) { navigate('/cart'); return; }
    const subtotal = items.reduce((s,i) => s + i.price * i.quantity, 0);
    const total    = subtotal + 2000;
    document.getElementById('checkout-items').innerHTML = items.map(i => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <img src="${i.image_url||'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200&q=80'}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;">
        <div style="flex:1"><div style="font-weight:700;font-size:14px">${esc(i.name)}</div><div style="font-size:12px;color:var(--light)">Qty: ${i.quantity}</div></div>
        <div style="font-weight:700;font-size:14px;color:var(--pink-dark)">${fmtPrice(i.price * i.quantity)}</div>
      </div>`).join('');
    document.getElementById('checkout-subtotal').textContent = fmtPrice(subtotal);
    document.getElementById('checkout-total').textContent    = fmtPrice(total);
  } catch(e) { toast('Failed to load cart', 'error'); }
}

async function submitOrder() {
  const name    = document.getElementById('sh-name').value.trim();
  const phone   = document.getElementById('sh-phone').value.trim();
  const address = document.getElementById('sh-address').value.trim();
  const notes   = document.getElementById('sh-notes').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cash_on_delivery';
  if (!name || !phone || !address) { toast('Please fill in all required fields', 'error'); return; }
  try {
    const { order_id } = await api('POST', '/api/orders', {
      shipping_name: name, shipping_phone: phone, shipping_address: address,
      notes, payment_method: payment
    });
    await updateCartCount();
    navigate('/confirmation?id=' + order_id);
  } catch(e) { toast(e.message || 'Order failed', 'error'); }
}

// ═══════════════════════════════════════════════
//  ORDER CONFIRMATION
// ═══════════════════════════════════════════════
async function showConfirmation(path) {
  if (!App.user) { navigate('/login'); return; }
  showPage('confirmation');
  const id = new URLSearchParams(path.split('?')[1]).get('id');
  try {
    const order = await api('GET', '/api/orders/' + id);
    document.getElementById('conf-order-num').textContent = '#JB-' + String(order.id).padStart(6,'0');
    document.getElementById('conf-status').textContent    = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    document.getElementById('conf-date').textContent      = fmtDate(order.created_at);
    document.getElementById('conf-payment').textContent   = order.payment_method?.replace(/_/g,' ') || 'Cash on Delivery';
    document.getElementById('conf-phone').textContent     = order.shipping_phone || '—';
    document.getElementById('conf-address').textContent   = order.shipping_address || '—';
    document.getElementById('conf-items').innerHTML = order.items.map(i => `
      <div class="confirm-item-row">
        <img class="confirm-item-img" src="${i.image_url||'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200&q=80'}" alt="${esc(i.name)}">
        <div style="flex:1"><div style="font-weight:700;font-size:14px">${esc(i.name)}</div><div style="font-size:12px;color:var(--light)">Qty: ${i.quantity}</div></div>
        <div style="font-weight:700;color:var(--pink-dark)">${fmtPrice(i.price * i.quantity)}</div>
      </div>`).join('');
    document.getElementById('conf-total').textContent = fmtPrice(order.total_amount);
  } catch(e) { navigate('/orders'); }
}

// ═══════════════════════════════════════════════
//  ORDERS LIST
// ═══════════════════════════════════════════════
async function showOrders() {
  if (!App.user) { navigate('/login'); return; }
  showPage('orders');
  try {
    const orders = await api('GET', '/api/orders');
    const list = document.getElementById('orders-list');
    if (!orders.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h2>No orders yet</h2><p>Your order history will appear here</p><button class="btn btn-pink btn-lg" onclick="navigate('/products')">Start Shopping</button></div>`;
      return;
    }
    list.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-card-header">
          <div><div class="order-id-text">Order #JB-${String(o.id).padStart(6,'0')}</div><div style="font-size:12px;color:var(--light);margin-top:2px">${fmtDate(o.created_at)}</div></div>
          <span class="status-badge status-${o.status}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span>
        </div>
        <div class="order-items-body">
          ${o.items.map(i => `
          <div class="order-item-row">
            <img class="order-item-img" src="${i.image_url||'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200&q=80'}" alt="${esc(i.name)}">
            <span style="flex:1;font-weight:600">${esc(i.name)}</span>
            <span style="color:var(--light)">×${i.quantity}</span>
            <span style="font-weight:700;color:var(--pink-dark);margin-left:12px">${fmtPrice(i.price*i.quantity)}</span>
          </div>`).join('')}
        </div>
        <div class="order-card-footer">
          <span style="font-size:13px;color:var(--light)">Delivery: ${fmtPrice(2000)}</span>
          <span class="order-total-text">${fmtPrice(o.total_amount)}</span>
        </div>
      </div>`).join('');
  } catch(e) { toast('Failed to load orders', 'error'); }
}

// ═══════════════════════════════════════════════
//  AUTH PAGES
// ═══════════════════════════════════════════════
function showLogin()    { if (App.user) { navigate('/'); return; } showPage('login'); clearErrors(); }
function showRegister() { if (App.user) { navigate('/'); return; } showPage('register'); clearErrors(); }

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
}
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = '❌ ' + msg; el.classList.add('show'); }
}

async function doLogin() {
  clearErrors();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showError('login-error', 'Please fill in all fields'); return; }
  try {
    const { user } = await api('POST', '/api/auth/login', { email, password });
    App.user = user;
    renderNavAuth();
    await updateCartCount();
    toast(`Welcome back, ${user.names.split(' ')[0]}! 👋`);
    navigate(user.role === 'seller' ? '/seller' : '/');
  } catch(e) { showError('login-error', e.message || 'Invalid credentials'); }
}

let selectedRole = 'buyer';
function setRole(role, el) {
  selectedRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

async function doRegister() {
  clearErrors();
  const names    = document.getElementById('reg-names').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!names || !email || !password) { showError('reg-error', 'Please fill in all fields'); return; }
  try {
    const { user } = await api('POST', '/api/auth/register', { names, email, password, role: selectedRole });
    App.user = user;
    renderNavAuth();
    toast('Account created! Welcome 🎉');
    navigate(user.role === 'seller' ? '/seller' : '/');
  } catch(e) { showError('reg-error', e.message || 'Registration failed'); }
}

// ═══════════════════════════════════════════════
//  SELLER DASHBOARD
// ═══════════════════════════════════════════════
function showSeller() {
  if (!App.user || App.user.role !== 'seller') { navigate('/login'); return; }
  showPage('seller');
  document.getElementById('seller-welcome').textContent = App.user.names.split(' ')[0];
  showSellerTab('dashboard', document.getElementById('stab-btn-dashboard'));
}

function showSellerTab(tab, btn) {
  document.querySelectorAll('.seller-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('stab-' + tab).style.display = 'block';
  if (btn) btn.classList.add('active');
  if (tab === 'dashboard')  loadSellerDashboard();
  if (tab === 'products')   loadSellerProducts();
  if (tab === 'categories') loadSellerCategories();
  if (tab === 'orders')     loadSellerOrders();
}

async function loadSellerDashboard() {
  try {
    const d = await api('GET', '/api/seller/dashboard');
    document.getElementById('m-revenue').textContent  = fmtPrice(d.revenue || 0);
    document.getElementById('m-products').textContent = d.total_products;
    document.getElementById('m-orders').textContent   = d.total_orders;
    document.getElementById('recent-orders-body').innerHTML = d.recent_orders.length
      ? d.recent_orders.map(o => `
        <tr>
          <td><strong>#JB-${String(o.id).padStart(6,'0')}</strong></td>
          <td>${esc(o.shipping_name||'—')}</td>
          <td>${fmtPrice(o.total_amount)}</td>
          <td>${fmtDate(o.created_at)}</td>
          <td><span class="status-badge status-${o.status}">${o.status}</span></td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--light);padding:32px">No orders yet</td></tr>';
  } catch(e) { console.error(e); }
}

async function loadSellerProducts() {
  try {
    const products = await api('GET', '/api/seller/products');
    document.getElementById('seller-products-body').innerHTML = products.length
      ? products.map(p => `
        <tr>
          <td><img src="${p.image_url||''}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;margin-right:10px;vertical-align:middle">${esc(p.name)}</td>
          <td>${esc(p.category_name||'—')}</td>
          <td>${fmtPrice(p.price)}</td>
          <td><span style="background:${p.stock<5?'#fef9c3':'#dcfce7'};color:${p.stock<5?'#854d0e':'#166534'};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700">${p.stock}</span></td>
          <td><div class="action-group">
            <button class="btn btn-outline btn-sm" onclick="openEditProduct(${p.id})">Edit</button>
            <button class="btn btn-red btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
          </div></td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--light);padding:32px">No products yet</td></tr>';
  } catch(e) { console.error(e); }
}

async function loadSellerCategories() {
  try {
    const cats = await api('GET', '/api/seller/categories');
    document.getElementById('seller-cats-body').innerHTML = cats.length
      ? cats.map(c => `
        <tr>
          <td><strong>${esc(c.label)}</strong></td>
          <td style="color:var(--mid)">${esc(c.description||'—')}</td>
          <td><button class="btn btn-red btn-sm" onclick="deleteCategory(${c.id})">Delete</button></td>
        </tr>`).join('')
      : '<tr><td colspan="3" style="text-align:center;color:var(--light);padding:32px">No categories</td></tr>';
  } catch(e) { console.error(e); }
}

async function loadSellerOrders() {
  try {
    const orders = await api('GET', '/api/seller/orders');
    document.getElementById('seller-orders-body').innerHTML = orders.length
      ? orders.map(o => `
        <tr>
          <td><strong>#JB-${String(o.id).padStart(6,'0')}</strong></td>
          <td>${esc(o.shipping_name||'—')}</td>
          <td>${o.items.length} item(s)</td>
          <td>${fmtPrice(o.total_amount)}</td>
          <td><span class="status-badge status-${o.status}">${o.status}</span></td>
          <td>
            <select onchange="updateOrderStatus(${o.id},this.value)" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-family:inherit;font-size:13px">
              ${['pending','processing','shipped','delivered','cancelled'].map(s => `<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
            </select>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:var(--light);padding:32px">No orders yet</td></tr>';
  } catch(e) { console.error(e); }
}

async function updateOrderStatus(id, status) {
  try {
    await api('PUT', '/api/seller/orders/' + id + '/status', { status });
    toast('Order status updated');
    loadSellerOrders();
  } catch(e) { toast(e.message, 'error'); }
}

// Product modal
let editingProductId = null;
async function openAddProduct() {
  editingProductId = null;
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  try {
    const cats = await api('GET', '/api/seller/categories');
    document.getElementById('pm-category').innerHTML = '<option value="">Select category</option>' + cats.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  } catch {}
  openModal('product-modal');
}

async function openEditProduct(id) {
  editingProductId = id;
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  try {
    const p = await api('GET', '/api/products/' + id);
    const cats = await api('GET', '/api/seller/categories');
    document.getElementById('pm-category').innerHTML = '<option value="">Select category</option>' + cats.map(c => `<option value="${c.id}" ${c.id==p.category_id?'selected':''}>${c.label}</option>`).join('');
    document.getElementById('pm-name').value        = p.name;
    document.getElementById('pm-description').value = p.description || '';
    document.getElementById('pm-price').value       = p.price;
    document.getElementById('pm-stock').value       = p.stock;
  } catch {}
  openModal('product-modal');
}

async function saveProduct() {
  const form = document.getElementById('product-form');
  const fd   = new FormData(form);
  try {
    if (editingProductId) {
      await api('PUT', '/api/seller/products/' + editingProductId, fd);
      toast('Product updated');
    } else {
      await api('POST', '/api/seller/products', fd);
      toast('Product added');
    }
    closeModal('product-modal');
    loadSellerProducts();
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await api('DELETE', '/api/seller/products/' + id);
    toast('Product deleted');
    loadSellerProducts();
  } catch(e) { toast(e.message, 'error'); }
}

async function saveCategory() {
  const label       = document.getElementById('cat-label').value.trim();
  const description = document.getElementById('cat-desc').value.trim();
  if (!label) { toast('Enter a category name', 'error'); return; }
  try {
    await api('POST', '/api/seller/categories', { label, description });
    toast('Category added');
    closeModal('cat-modal');
    loadSellerCategories();
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  try {
    await api('DELETE', '/api/seller/categories/' + id);
    toast('Category deleted');
    loadSellerCategories();
  } catch(e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════
//  STATIC PAGES
// ═══════════════════════════════════════════════
function showAbout()   { showPage('about'); }
function showContact() { showPage('contact'); }

// ═══════════════════════════════════════════════
//  MODAL HELPERS
// ═══════════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ═══════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════
function esc(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  navigate(location.pathname + location.search, false);
});
