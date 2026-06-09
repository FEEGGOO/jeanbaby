const router = require('express').Router();
const db     = require('../db');

// GET /api/products  ?q=&category_id=&page=&limit=
router.get('/', async (req, res) => {
  const { q = '', category_id = 0, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;
  if (q) { where += ` AND p.name ILIKE $${idx++}`; params.push(`%${q}%`); }
  if (parseInt(category_id) > 0) { where += ` AND p.category_id = $${idx++}`; params.push(parseInt(category_id)); }

  try {
    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) as count FROM products p ${where}`, params);
    const total = parseInt(count);
    const [rows] = await db.query(
      `SELECT p.*, c.label as category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), offset]
    );
    res.json({ products: rows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('Products error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY label');
    res.json(rows);
  } catch (e) {
    console.error('Categories error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.label as category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
