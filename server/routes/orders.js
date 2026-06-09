const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const { shipping_name, shipping_phone, shipping_address, notes, payment_method } = req.body;
  if (!shipping_name || !shipping_phone || !shipping_address)
    return res.status(400).json({ error: 'Shipping details required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [cartItems] = await conn.query(
      `SELECT ci.quantity, p.id as product_id, p.price FROM cart_items ci
       JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1`, [uid]);
    if (!cartItems.length) { await conn.rollback(); conn.release(); return res.status(400).json({ error: 'Cart is empty' }); }
    const total = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0) + 2000;
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id,shipping_name,shipping_phone,shipping_address,notes,payment_method,total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [uid, shipping_name, shipping_phone, shipping_address, notes, payment_method||'cash_on_delivery', total]);
    const orderId = orderResult[0].id;
    for (const item of cartItems) {
      await conn.query('INSERT INTO order_items (order_id,product_id,quantity,price) VALUES ($1,$2,$3,$4)',
        [orderId, item.product_id, item.quantity, item.price]);
    }
    await conn.query('DELETE FROM cart_items WHERE user_id=$1', [uid]);
    await conn.commit();
    conn.release();
    res.json({ success: true, order_id: orderId });
  } catch (e) {
    await conn.rollback(); conn.release();
    res.status(500).json({ error: e.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const [orders] = await db.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [uid]);
  for (const order of orders) {
    const [items] = await db.query(
      `SELECT oi.*, p.name, p.image_url FROM order_items oi
       JOIN products p ON p.id = oi.product_id WHERE oi.order_id=$1`, [order.id]);
    order.items = items;
  }
  res.json(orders);
});

router.get('/:id', requireAuth, async (req, res) => {
  const [[order]] = await db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [req.params.id, req.session.user.id]);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const [items] = await db.query(
    `SELECT oi.*, p.name, p.image_url FROM order_items oi
     JOIN products p ON p.id = oi.product_id WHERE oi.order_id=$1`, [order.id]);
  order.items = items;
  res.json(order);
});

module.exports = router;
