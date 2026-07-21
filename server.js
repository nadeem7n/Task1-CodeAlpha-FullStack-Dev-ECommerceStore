const express = require('express');
const path = require('path');
const { load, save } = require('./db');
const { hashPassword, verifyPassword, makeToken, sessions, requireAuth } = require('./auth');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Seed data ----------
const defaultProducts = [
  { id: 1, name: 'Wireless Headphones', price: 59.99, category: 'Electronics', image: 'https://picsum.photos/seed/headphones/400/300', description: 'Over-ear wireless headphones with noise cancellation.', stock: 25 },
  { id: 2, name: 'Smart Watch', price: 89.99, category: 'Electronics', image: 'https://picsum.photos/seed/watch/400/300', description: 'Fitness tracking smart watch with heart-rate monitor.', stock: 15 },
  { id: 3, name: 'Running Shoes', price: 45.00, category: 'Footwear', image: 'https://picsum.photos/seed/shoes/400/300', description: 'Lightweight breathable running shoes.', stock: 40 },
  { id: 4, name: 'Backpack', price: 32.50, category: 'Accessories', image: 'https://picsum.photos/seed/backpack/400/300', description: 'Water-resistant everyday backpack, 25L.', stock: 30 },
  { id: 5, name: 'Coffee Maker', price: 74.00, category: 'Home', image: 'https://picsum.photos/seed/coffee/400/300', description: '12-cup programmable drip coffee maker.', stock: 12 },
  { id: 6, name: 'Desk Lamp', price: 21.99, category: 'Home', image: 'https://picsum.photos/seed/lamp/400/300', description: 'LED desk lamp with adjustable brightness.', stock: 50 },
  { id: 7, name: 'Yoga Mat', price: 18.00, category: 'Sports', image: 'https://picsum.photos/seed/yoga/400/300', description: 'Non-slip eco-friendly yoga mat.', stock: 60 },
  { id: 8, name: 'Bluetooth Speaker', price: 39.99, category: 'Electronics', image: 'https://picsum.photos/seed/speaker/400/300', description: 'Portable waterproof bluetooth speaker.', stock: 20 },
];

let products = load('products', defaultProducts);
let users = load('users', []);
let orders = load('orders', []);
let nextUserId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
let nextOrderId = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;

// ---------- Auth routes ----------
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password are required' });
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const user = { id: nextUserId++, name, email, passwordHash: hashPassword(password) };
  users.push(user);
  save('users', users);
  const token = makeToken();
  sessions.set(token, user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = makeToken();
  sessions.set(token, user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/logout', requireAuth, (req, res) => {
  const header = req.headers.authorization || '';
  sessions.delete(header.slice(7));
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  res.json({ id: user.id, name: user.name, email: user.email });
});

// ---------- Product routes ----------
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let result = products;
  if (category) result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  res.json(result);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ---------- Order routes ----------
// Body: { items: [{ productId, qty }] }
app.post('/api/orders', requireAuth, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }
  let total = 0;
  const orderItems = [];
  for (const { productId, qty } of items) {
    const product = products.find(p => p.id === Number(productId));
    if (!product) return res.status(400).json({ error: `Product ${productId} not found` });
    if (qty < 1 || qty > product.stock) return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
    total += product.price * qty;
    orderItems.push({ productId: product.id, name: product.name, price: product.price, qty });
    product.stock -= qty; // reduce stock
  }
  save('products', products);
  const order = {
    id: nextOrderId++,
    userId: req.userId,
    items: orderItems,
    total: Number(total.toFixed(2)),
    status: 'processing',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  save('orders', orders);
  res.status(201).json(order);
});

app.get('/api/orders', requireAuth, (req, res) => {
  res.json(orders.filter(o => o.userId === req.userId));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`E-commerce store running at http://localhost:${PORT}`));
