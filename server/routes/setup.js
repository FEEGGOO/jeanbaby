// Auto-setup route - creates tables and seeds data
// Visit /setup to initialize the database
const router = require('express').Router();
const db     = require('../db');
const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
  try {
    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        names         VARCHAR(150)  NOT NULL,
        email         VARCHAR(255)  NOT NULL UNIQUE,
        password_hash VARCHAR(255)  NOT NULL,
        role          VARCHAR(10)   NOT NULL DEFAULT 'buyer',
        phone         VARCHAR(20)   DEFAULT NULL,
        address       TEXT          DEFAULT NULL,
        profile_image VARCHAR(500)  DEFAULT NULL,
        created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        label       VARCHAR(100) NOT NULL,
        description TEXT         DEFAULT NULL,
        created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id           SERIAL PRIMARY KEY,
        seller_id    INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id  INT           DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL,
        name         VARCHAR(200)  NOT NULL,
        description  TEXT          DEFAULT NULL,
        price        DECIMAL(10,2) NOT NULL,
        stock        INT           NOT NULL DEFAULT 0,
        image_url    VARCHAR(500)  DEFAULT NULL,
        created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id         SERIAL PRIMARY KEY,
        user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity   INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id               SERIAL PRIMARY KEY,
        user_id          INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status           VARCHAR(20)   NOT NULL DEFAULT 'pending',
        shipping_name    VARCHAR(150)  DEFAULT NULL,
        shipping_phone   VARCHAR(20)   DEFAULT NULL,
        shipping_address TEXT          DEFAULT NULL,
        notes            TEXT          DEFAULT NULL,
        payment_method   VARCHAR(50)   DEFAULT 'cash_on_delivery',
        total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id         SERIAL PRIMARY KEY,
        order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity   INT           NOT NULL,
        price      DECIMAL(10,2) NOT NULL
      )
    `);

    // Seed categories
    const catLabels = [
      ['Clothing',  'Soft, organic clothing for newborns to toddlers.'],
      ['Sleep',     'Sleep sacks, cribs and bedtime essentials.'],
      ['Feeding',   'Bottles, bibs, high chairs and meal-time essentials.'],
      ['Toys',      'Educational and sensory toys for every stage.'],
      ['Safety',    'Baby monitors, thermometers, and safety gear.'],
    ];
    for (const [label, description] of catLabels) {
      await db.query(
        'INSERT INTO categories (label, description) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [label, description]
      );
    }

    // Seed users
    const hash = await bcrypt.hash('password123', 10);
    await db.query(
      'INSERT INTO users (names,email,password_hash,role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING',
      ['Jean Baby Store', 'seller@jeanbaby.rw', hash, 'seller']
    );
    await db.query(
      'INSERT INTO users (names,email,password_hash,role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING',
      ['Amina Uwase', 'buyer@jeanbaby.rw', hash, 'buyer']
    );

    // Get seller id and category ids
    const [[seller]] = await db.query("SELECT id FROM users WHERE email='seller@jeanbaby.rw'");
    const [cats]     = await db.query("SELECT id, label FROM categories ORDER BY id");
    const catMap     = {};
    cats.forEach(c => catMap[c.label] = c.id);

    // Seed products
    const products = [
      [seller.id, catMap['Clothing'], 'Organic Cotton Onesie',     'Ultra-soft certified organic cotton onesie for 0-3 months.',      4500, 25, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80'],
      [seller.id, catMap['Sleep'],    'Bamboo Sleep Sack',          'Temperature-regulating bamboo sleep sack with smooth zip.',       8900, 15, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'],
      [seller.id, catMap['Feeding'],  'Anti-Colic Feeding Bottle',  '260ml wide-neck bottle with soft silicone nipple.',               5200, 40, 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&q=80'],
      [seller.id, catMap['Feeding'],  'Silicone Bib Set (3-pack)',  'Waterproof dishwasher-safe silicone bibs.',                       2800, 30, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'],
      [seller.id, catMap['Toys'],     'Sensory Activity Cube',      'Six-sided wooden activity cube with shapes and mirrors.',        12500, 10, 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80'],
      [seller.id, catMap['Toys'],     'Wooden Stacking Rings',      'FSC-certified beechwood stacking rings in pastel colours.',       6700, 20, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'],
      [seller.id, catMap['Safety'],   'Baby Monitor Pro',           '1080p HD baby monitor with night vision and two-way audio.',     24000,  8, 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80'],
      [seller.id, catMap['Safety'],   'Digital Ear Thermometer',    'Accurate reading in 1 second. Stores 20 readings.',               7500, 22, 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80'],
    ];
    for (const [sid, cid, name, desc, price, stock, img] of products) {
      await db.query(
        'INSERT INTO products (seller_id,category_id,name,description,price,stock,image_url) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [sid, cid, name, desc, price, stock, img]
      );
    }

    res.send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#f0fdf4">
      <h1 style="color:#16a34a">✅ Database Setup Complete!</h1>
      <p>Tables created and data seeded successfully.</p>
      <ul>
        <li>✅ users table</li>
        <li>✅ categories table (5 categories)</li>
        <li>✅ products table (8 products)</li>
        <li>✅ cart_items table</li>
        <li>✅ orders table</li>
        <li>✅ order_items table</li>
      </ul>
      <p><strong>Demo accounts:</strong></p>
      <ul>
        <li>Buyer: buyer@jeanbaby.rw / password123</li>
        <li>Seller: seller@jeanbaby.rw / password123</li>
      </ul>
      <a href="/" style="background:#f472b6;color:#fff;padding:12px 24px;border-radius:99px;text-decoration:none;font-weight:700">Go to App →</a>
      </body></html>
    `);
  } catch (e) {
    console.error(e);
    res.status(500).send(`<pre style="color:red">Error: ${e.message}</pre>`);
  }
});

// Fix broken product images
router.get('/fix-images', async (req, res) => {
  try {
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80' WHERE name='Silicone Bib Set (3-pack)'`);
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&q=80' WHERE name='Anti-Colic Feeding Bottle'`);
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80' WHERE name='Bamboo Sleep Sack'`);
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' WHERE name='Organic Cotton Onesie'`);
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80' WHERE name='Sensory Activity Cube'`);
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&q=80' WHERE name='Wooden Stacking Rings'`);
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80' WHERE name='Baby Monitor Pro'`);
    await db.query(`UPDATE products SET image_url='https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80' WHERE name='Digital Ear Thermometer'`);
    res.send('<h1 style="color:green">✅ Images fixed! <a href="/">Go to App</a></h1>');
  } catch(e) {
    res.status(500).send(`<pre style="color:red">${e.message}</pre>`);
  }
});

