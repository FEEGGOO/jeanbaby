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

router.get('/dashboard', requireSeller, async (req, res) => {
  const sid = req.session.user.id;
  const [[p]] = await db.query('SELECT COUNT(*) as total_products FROM products WHERE seller_id=$1', [sid]);
  const [[o]] = await db.query(`SELECT COUNT(*) as total_orders FROM orders ord JOIN order_items oi ON oi.order_id=ord.id JOIN products p ON p.id=oi.product_id WHERE p.seller_id=$1`, [sid]);
  const [[r]] = await db.query(`SELECT COALESCE(SUM(oi.price*oi.quantity),0) as revenue FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE p.seller_id=$1`, [sid]);
  const [recent_orders] = await db.query(
    `SELECT DISTINCT o.id, o.status, o.created_at, o.shipping_name, o.total_amount
     FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id
     WHERE p.seller_id=$1 ORDER BY o.created_at DESC LIMIT 5`, [sid]);
  res.json({ total_products: parseInt(p.total_products), total_orders: parseInt(o.total_orders), revenue: r.revenue, recent_orders });
});

router.get('/products', requireSeller, async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, c.label as category_name FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.seller_id=$1 ORDER BY p.created_at DESC`, [req.session.user.id]);
  res.json(rows);
});

router.post('/products', requireSeller, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await db.query(
    'INSERT INTO products (seller_id,category_id,name,description,price,stock,image_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [req.session.user.id, category_id||null, name, description, price, stock, image_url]);
  res.json({ id: result[0].id });
});

router.put('/products/:id', requireSeller, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  let q = 'UPDATE products SET name=$1,description=$2,price=$3,stock=$4,category_id=$5';
  const params = [name, description, price, stock, category_id||null];
  if (req.file) { q += `,image_url=$${params.length+1}`; params.push(`/uploads/${req.file.filename}`); }
  q += ` WHERE id=$${params.length+1} AND seller_id=$${params.length+2}`;
  params.push(req.params.id, req.session.user.id);
  await db.query(q, params);
  res.json({ success: true });
});

router.delete('/products/:id', requireSeller, async (req, res) => {
  await db.query('DELETE FROM products WHERE id=$1 AND seller_id=$2', [req.params.id, req.session.user.id]);
  res.json({ success: true });
});

router.get('/orders', requireSeller, async (req, res) => {
  const sid = req.session.user.id;
  const [orders] = await db.query(
    `SELECT DISTINCT o.* FROM orders o JOIN order_items oi ON oi.order_id=o.id
     JOIN products p ON p.id=oi.product_id WHERE p.seller_id=$1 ORDER BY o.created_at DESC`, [sid]);
  for (const order of orders) {
    const [items] = await db.query(
      `SELECT oi.*, p.name FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1`, [order.id]);
    order.items = items;
  }
  res.json(orders);
});

router.put('/orders/:id/status', requireSeller, async (req, res) => {
  const { status } = req.body;
  await db.query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id]);
  res.json({ success: true });
});

router.get('/categories', requireSeller, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY label');
  res.json(rows);
});

router.post('/categories', requireSeller, async (req, res) => {
  const { label, description } = req.body;
  const [result] = await db.query('INSERT INTO categories (label,description) VALUES ($1,$2) RETURNING id', [label, description]);
  res.json({ id: result[0].id });
});

router.delete('/categories/:id', requireSeller, async (req, res) => {
  await db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
