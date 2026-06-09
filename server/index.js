require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Setup route MUST come before static files
app.use('/setup',        require('./routes/setup'));

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Uploads folder
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'jeanbaby_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/seller',   require('./routes/seller'));
app.use('/setup',        require('./routes/setup'));

// ── SPA fallback – serve index.html for all non-API routes ────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  Jean Baby server running on http://localhost:${PORT}`);
});
