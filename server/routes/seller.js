const router   = require('express').Router();
const db       = require('../db');
const multer   = require('multer');
const path     = require('path');
const { requireSeller } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads')),
  filename:    (req, file, cb) => cb(null, `prod_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/seller/dashboard
router.get('/dashboard', requireSeller, async (req, res) => {
  const sid = req.session.user.id;
  const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM products WHERE seller_id=?', [sid]);
  const [[{ total_orders }]]   = await db.query('SELECT COUNT(*) as total_orders FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE p.seller_id=?', [sid]);
  const [[{ revenue }]]        = await db.query('SELECT COALESCE(SUM(oi.price*oi.quantity),0) as revenue FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE p.seller_id=?', [sid]);
  const [recent_orders]        = await db.query(
    `SELECT o.id, o.status, o.created_at, o.shipping_name, o.total_amount
     FROM orders o JOIN order_items oi ON oi.order_id=o.id
     JOIN products p ON p.id=oi.product_id WHERE p.seller_id=?
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT 5`, [sid]);
  res.json({ total_products, total_orders, revenue, recent_orders });
});

// GET /api/seller/products
router.get('/products', requireSeller, async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, c.label as category_name FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.seller_id=? ORDER BY p.created_at DESC`, [req.session.user.id]);
  res.json(rows);
});

// POST /api/seller/products
router.post('/products', requireSeller, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await db.query(
    'INSERT INTO products (seller_id,category_id,name,description,price,stock,image_url) VALUES (?,?,?,?,?,?,?)',
    [req.session.user.id, category_id||null, name, description, price, stock, image_url]);
  res.json({ id: result.insertId });
});

// PUT /api/seller/products/:id
router.put('/products/:id', requireSeller, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  const fields = { name, description, price, stock, category_id: category_id||null };
  if (req.file) fields.image_url = `/uploads/${req.file.filename}`;
  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  await db.query(`UPDATE products SET ${sets} WHERE id=? AND seller_id=?`,
    [...Object.values(fields), req.params.id, req.session.user.id]);
  res.json({ success: true });
});

// DELETE /api/seller/products/:id
router.delete('/products/:id', requireSeller, async (req, res) => {
  await db.query('DELETE FROM products WHERE id=? AND seller_id=?', [req.params.id, req.session.user.id]);
  res.json({ success: true });
});

// GET /api/seller/orders
router.get('/orders', requireSeller, async (req, res) => {
  const sid = req.session.user.id;
  const [orders] = await db.query(
    `SELECT DISTINCT o.* FROM orders o
     JOIN order_items oi ON oi.order_id=o.id
     JOIN products p ON p.id=oi.product_id
     WHERE p.seller_id=? ORDER BY o.created_at DESC`, [sid]);
  for (const order of orders) {
    const [items] = await db.query(
      `SELECT oi.*, p.name FROM order_items oi
       JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`, [order.id]);
    order.items = items;
  }
  res.json(orders);
});

// PUT /api/seller/orders/:id/status
router.put('/orders/:id/status', requireSeller, async (req, res) => {
  const { status } = req.body;
  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await db.query('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
  res.json({ success: true });
});

// GET /api/seller/categories
router.get('/categories', requireSeller, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY label');
  res.json(rows);
});

// POST /api/seller/categories
router.post('/categories', requireSeller, async (req, res) => {
  const { label, description } = req.body;
  const [result] = await db.query('INSERT INTO categories (label,description) VALUES (?,?)', [label, description]);
  res.json({ id: result.insertId });
});

// DELETE /api/seller/categories/:id
router.delete('/categories/:id', requireSeller, async (req, res) => {
  await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
