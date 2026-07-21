const API = '/api';
let state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cart') || '{}'), // { productId: qty }
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  category: '',
  search: '',
};

// ---------- helpers ----------
function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2200);
}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('[data-close]').forEach(btn =>
  btn.addEventListener('click', () => closeModal(btn.dataset.close))
);

function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); renderCartCount(); }

// ---------- render: auth area ----------
function renderAuthArea() {
  const el = document.getElementById('authArea');
  if (state.user) {
    el.innerHTML = `<div class="user-chip">👤 ${state.user.name} <button class="link-btn" id="logoutBtn">Logout</button></div>`;
    document.getElementById('logoutBtn').onclick = logout;
  } else {
    el.innerHTML = `<button class="primary-btn" id="loginOpenBtn">Login</button>`;
    document.getElementById('loginOpenBtn').onclick = () => openModal('authModal');
  }
}

async function logout() {
  if (state.token) await fetch(`${API}/logout`, { method: 'POST', headers: authHeaders() }).catch(() => {});
  state.token = null; state.user = null;
  localStorage.removeItem('token'); localStorage.removeItem('user');
  renderAuthArea();
  toast('Logged out');
}

// ---------- products ----------
async function loadProducts() {
  const params = new URLSearchParams();
  if (state.category) params.set('category', state.category);
  if (state.search) params.set('search', state.search);
  const res = await fetch(`${API}/products?${params}`);
  state.products = await res.json();
  renderCategories();
  renderProducts();
}

function renderCategories() {
  const cats = ['All', ...new Set(state.products.length ? state.products.map(p => p.category) : [])];
  // fetch all categories once regardless of filter — do a light request without filters if needed
  const el = document.getElementById('categories');
  if (el.dataset.loaded === '1') return; // only build chip list once from full set
}

async function loadAllCategoriesOnce() {
  const res = await fetch(`${API}/products`);
  const all = await res.json();
  const cats = ['All', ...new Set(all.map(p => p.category))];
  const el = document.getElementById('categories');
  el.innerHTML = cats.map(c =>
    `<button class="cat-chip ${c === 'All' && !state.category ? 'active' : ''}" data-cat="${c === 'All' ? '' : c}">${c}</button>`
  ).join('');
  el.dataset.loaded = '1';
  el.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.category = chip.dataset.cat;
      el.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadProducts();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!state.products.length) {
    grid.innerHTML = `<p>No products found.</p>`;
    return;
  }
  grid.innerHTML = state.products.map(p => `
    <div class="product-card" data-id="${p.id}">
      <img src="${p.image}" alt="${p.name}">
      <div class="info">
        <div class="cat">${p.category}</div>
        <h3>${p.name}</h3>
        <div class="price">$${p.price.toFixed(2)}</div>
        <button class="primary-btn add-btn" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-btn')) return;
      openProductDetail(Number(card.dataset.id));
    });
  });
  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(Number(btn.dataset.id));
    });
  });
}

function openProductDetail(id) {
  const p = state.products.find(x => x.id === id);
  document.getElementById('productDetail').innerHTML = `
    <div class="product-detail-inner">
      <img src="${p.image}" alt="${p.name}">
      <div class="info">
        <div class="cat">${p.category}</div>
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <div class="price" style="font-size:1.4rem">$${p.price.toFixed(2)}</div>
        <p class="stock-badge">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</p>
        <button class="primary-btn" id="detailAddBtn" ${p.stock < 1 ? 'disabled' : ''}>Add to Cart</button>
      </div>
    </div>
  `;
  document.getElementById('detailAddBtn').onclick = () => { addToCart(p.id); closeModal('productModal'); };
  openModal('productModal');
}

function addToCart(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  toast('Added to cart');
}

// ---------- cart ----------
function renderCartCount() {
  const count = Object.values(state.cart).reduce((a, b) => a + b, 0);
  document.getElementById('cartCount').textContent = count;
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const ids = Object.keys(state.cart);
  if (!ids.length) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('cartTotal').textContent = '0.00';
    return;
  }
  let total = 0;
  container.innerHTML = ids.map(id => {
    const p = state.products.find(x => x.id === Number(id));
    if (!p) return '';
    const qty = state.cart[id];
    total += p.price * qty;
    return `
      <div class="cart-item" data-id="${id}">
        <img src="${p.image}">
        <div style="flex:1">
          <div>${p.name}</div>
          <div class="price">$${p.price.toFixed(2)}</div>
          <div class="qty-controls">
            <button class="dec">-</button>
            <span>${qty}</span>
            <button class="inc">+</button>
            <button class="remove" style="margin-left:8px;color:#d33;border:none;background:none;cursor:pointer;">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById('cartTotal').textContent = total.toFixed(2);

  container.querySelectorAll('.cart-item').forEach(item => {
    const id = item.dataset.id;
    item.querySelector('.inc').onclick = () => { state.cart[id]++; saveCart(); renderCart(); };
    item.querySelector('.dec').onclick = () => {
      state.cart[id]--;
      if (state.cart[id] <= 0) delete state.cart[id];
      saveCart(); renderCart();
    };
    item.querySelector('.remove').onclick = () => { delete state.cart[id]; saveCart(); renderCart(); };
  });
}

document.getElementById('cartBtn').addEventListener('click', () => {
  renderCart();
  document.getElementById('cartDrawer').classList.remove('hidden');
});

document.getElementById('checkoutBtn').addEventListener('click', async () => {
  if (!state.user) {
    toast('Please login to checkout');
    openModal('authModal');
    return;
  }
  const items = Object.entries(state.cart).map(([productId, qty]) => ({ productId: Number(productId), qty }));
  if (!items.length) { toast('Cart is empty'); return; }
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!res.ok) { toast(data.error || 'Checkout failed'); return; }
  state.cart = {};
  saveCart();
  closeModal('cartDrawer');
  toast(`Order #${data.id} placed! Total $${data.total}`);
  loadProducts();
});

// ---------- orders ----------
document.getElementById('ordersBtn').addEventListener('click', async () => {
  if (!state.user) { toast('Please login first'); openModal('authModal'); return; }
  const res = await fetch(`${API}/orders`, { headers: authHeaders() });
  const orders = await res.json();
  const list = document.getElementById('ordersList');
  list.innerHTML = orders.length ? orders.map(o => `
    <div class="order-card">
      <div class="oid">Order #${o.id} — ${new Date(o.createdAt).toLocaleString()}</div>
      <div>Status: <strong>${o.status}</strong></div>
      ${o.items.map(it => `<div class="order-item-row"><span>${it.name} × ${it.qty}</span><span>$${(it.price * it.qty).toFixed(2)}</span></div>`).join('')}
      <div class="order-item-row"><strong>Total</strong><strong>$${o.total.toFixed(2)}</strong></div>
    </div>
  `).join('') : '<p>No orders yet.</p>';
  openModal('ordersModal');
});

// ---------- auth ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('loginForm').classList.toggle('hidden', btn.dataset.tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', btn.dataset.tab !== 'register');
  });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const res = await fetch(`${API}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) { document.getElementById('loginError').textContent = data.error; return; }
  onAuthSuccess(data);
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const res = await fetch(`${API}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) { document.getElementById('registerError').textContent = data.error; return; }
  onAuthSuccess(data);
});

function onAuthSuccess(data) {
  state.token = data.token; state.user = data.user;
  localStorage.setItem('token', state.token);
  localStorage.setItem('user', JSON.stringify(state.user));
  renderAuthArea();
  closeModal('authModal');
  toast(`Welcome, ${state.user.name}!`);
}

// ---------- search ----------
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { state.search = e.target.value; loadProducts(); }, 300);
});

// ---------- init ----------
(async function init() {
  renderAuthArea();
  renderCartCount();
  await loadAllCategoriesOnce();
  await loadProducts();
})();
