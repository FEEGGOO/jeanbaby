const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const db      = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { names, email, password, role } = req.body;
  if (!names || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const safeRole = role === 'seller' ? 'seller' : 'buyer';
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (names, email, password_hash, role) VALUES (?,?,?,?)',
      [names, email, hash, safeRole]
    );
    const user = { id: result.insertId, names, email, role: safeRole };
    req.session.user = user;
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const sessionUser = { id: user.id, names: user.names, email: user.email, role: user.role, profile_image: user.profile_image };
    req.session.user = sessionUser;
    res.json({ user: sessionUser });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { names, phone, address } = req.body;
  try {
    await db.query('UPDATE users SET names=?, phone=?, address=? WHERE id=?',
      [names, phone, address, req.session.user.id]);
    req.session.user.names = names;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
