const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const [rows] = await db.query(
    `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1 ORDER BY ci.created_at ASC`, [uid]);
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const { product_id, quantity = 1 } = req.body;
  try {
    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + $3`,
      [uid, product_id, quantity]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const { quantity } = req.body;
  if (quantity < 1) {
    await db.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, uid]);
  } else {
    await db.query('UPDATE cart_items SET quantity=$1 WHERE id=$2 AND user_id=$3', [quantity, req.params.id, uid]);
  }
  res.json({ success: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.session.user.id]);
  res.json({ success: true });
});

router.delete('/', requireAuth, async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE user_id=$1', [req.session.user.id]);
  res.json({ success: true });
});

module.exports = router;
