require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');
const fs      = require('fs');

const app = express();

// ── Body parsers (must come first) ────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session (MUST come before any routes that use req.session) ────
app.use(session({
  secret: process.env.SESSION_SECRET || 'jeanbaby_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// ── Uploads folder ────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── API Routes (must come BEFORE static files & SPA fallback) ─────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/seller',   require('./routes/seller'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/setup',        require('./routes/setup'));

// ── Static files ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── SPA fallback – serve index.html for all non-API routes ────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  Jean Baby server running on http://localhost:${PORT}`);
});
