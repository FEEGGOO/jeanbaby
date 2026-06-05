const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/cart
router.get('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const [rows] = await db.query(
    `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ? ORDER BY ci.created_at ASC`, [uid]);
  res.json(rows);
});

// POST /api/cart  { product_id, quantity }
router.post('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const { product_id, quantity = 1 } = req.body;
  try {
    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [uid, product_id, quantity, quantity]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/cart/:id  { quantity }
router.put('/:id', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const { quantity } = req.body;
  if (quantity < 1) {
    await db.query('DELETE FROM cart_items WHERE id=? AND user_id=?', [req.params.id, uid]);
  } else {
    await db.query('UPDATE cart_items SET quantity=? WHERE id=? AND user_id=?', [quantity, req.params.id, uid]);
  }
  res.json({ success: true });
});

// DELETE /api/cart/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE id=? AND user_id=?', [req.params.id, req.session.user.id]);
  res.json({ success: true });
});

// DELETE /api/cart  (clear all)
router.delete('/', requireAuth, async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE user_id=?', [req.session.user.id]);
  res.json({ success: true });
});

module.exports = router;
