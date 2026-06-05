const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/orders  — place order from cart
router.post('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const { shipping_name, shipping_phone, shipping_address, notes, payment_method } = req.body;
  if (!shipping_name || !shipping_phone || !shipping_address)
    return res.status(400).json({ error: 'Shipping details required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch cart
    const [cartItems] = await conn.query(
      `SELECT ci.quantity, p.id as product_id, p.price, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`, [uid]);
    if (!cartItems.length) { await conn.rollback(); conn.release(); return res.status(400).json({ error: 'Cart is empty' }); }

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const total    = subtotal + 2000; // delivery fee

    // Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, shipping_name, shipping_phone, shipping_address, notes, payment_method, total_amount)
       VALUES (?,?,?,?,?,?,?)`,
      [uid, shipping_name, shipping_phone, shipping_address, notes, payment_method || 'cash_on_delivery', total]);
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)',
        [orderId, item.product_id, item.quantity, item.price]);
    }

    // Clear cart
    await conn.query('DELETE FROM cart_items WHERE user_id=?', [uid]);

    await conn.commit();
    conn.release();
    res.json({ success: true, order_id: orderId });
  } catch (e) {
    await conn.rollback();
    conn.release();
    console.error(e);
    res.status(500).json({ error: 'Order failed' });
  }
});

// GET /api/orders  — buyer's orders
router.get('/', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const [orders] = await db.query(
    'SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', [uid]);
  for (const order of orders) {
    const [items] = await db.query(
      `SELECT oi.*, p.name, p.image_url FROM order_items oi
       JOIN products p ON p.id = oi.product_id WHERE oi.order_id=?`, [order.id]);
    order.items = items;
  }
  res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req, res) => {
  const [[order]] = await db.query(
    'SELECT * FROM orders WHERE id=? AND user_id=?', [req.params.id, req.session.user.id]);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const [items] = await db.query(
    `SELECT oi.*, p.name, p.image_url FROM order_items oi
     JOIN products p ON p.id = oi.product_id WHERE oi.order_id=?`, [order.id]);
  order.items = items;
  res.json(order);
});

module.exports = router;
