const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const db      = require('../db');

router.post('/register', async (req, res) => {
  const { names, email, password, role } = req.body;
  if (!names || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const safeRole = role === 'seller' ? 'seller' : 'buyer';
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (names, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id',
      [names, email, hash, safeRole]);
    const user = { id: result[0].id, names, email, role: safeRole };
    req.session.user = user;
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const sessionUser = { id: user.id, names: user.names, email: user.email, role: user.role };
    req.session.user = sessionUser;
    res.json({ user: sessionUser });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

router.put('/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  const { names, phone, address } = req.body;
  try {
    await db.query('UPDATE users SET names=$1, phone=$2, address=$3 WHERE id=$4',
      [names, phone, address, req.session.user.id]);
    req.session.user.names = names;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
