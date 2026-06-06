-- Jean Baby PostgreSQL Schema
-- EXAM-28524/2025

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
);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  label       VARCHAR(100) NOT NULL,
  description TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

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
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

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
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT           NOT NULL,
  price      DECIMAL(10,2) NOT NULL
);

-- Seed categories
INSERT INTO categories (label, description) VALUES
('Clothing',  'Soft, organic clothing for newborns to toddlers.')
ON CONFLICT DO NOTHING;
INSERT INTO categories (label, description) VALUES
('Sleep',     'Sleep sacks, cribs and bedtime essentials.')
ON CONFLICT DO NOTHING;
INSERT INTO categories (label, description) VALUES
('Feeding',   'Bottles, bibs, high chairs and meal-time essentials.')
ON CONFLICT DO NOTHING;
INSERT INTO categories (label, description) VALUES
('Toys',      'Educational and sensory toys for every stage.')
ON CONFLICT DO NOTHING;
INSERT INTO categories (label, description) VALUES
('Safety',    'Baby monitors, thermometers, and safety gear.')
ON CONFLICT DO NOTHING;

-- Seed seller (password: password123)
INSERT INTO users (names, email, password_hash, role) VALUES
('Jean Baby Store', 'seller@jeanbaby.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller')
ON CONFLICT (email) DO NOTHING;

-- Seed buyer (password: password123)
INSERT INTO users (names, email, password_hash, role) VALUES
('Amina Uwase', 'buyer@jeanbaby.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'buyer')
ON CONFLICT (email) DO NOTHING;

-- Seed products
INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url) VALUES
(1, 1, 'Organic Cotton Onesie', 'Ultra-soft certified organic cotton onesie for 0-3 months.', 4500, 25, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80'),
(1, 2, 'Bamboo Sleep Sack', 'Temperature-regulating bamboo sleep sack with smooth zip closure.', 8900, 15, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'),
(1, 3, 'Anti-Colic Feeding Bottle', '260ml wide-neck bottle with soft silicone nipple.', 5200, 40, 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&q=80'),
(1, 3, 'Silicone Bib Set (3-pack)', 'Waterproof dishwasher-safe silicone bibs with deep catch pocket.', 2800, 30, 'https://images.unsplash.com/photo-1590737976076-ad1e4c291cec?w=600&q=80'),
(1, 4, 'Sensory Activity Cube', 'Six-sided wooden activity cube with shapes, mirrors and gears.', 12500, 10, 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80'),
(1, 4, 'Wooden Stacking Rings', 'FSC-certified beechwood stacking rings in pastel colours.', 6700, 20, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'),
(1, 5, 'Baby Monitor Pro', '1080p HD baby monitor with night vision and two-way audio.', 24000, 8, 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80'),
(1, 5, 'Digital Ear Thermometer', 'Accurate reading in 1 second. Stores 20 readings.', 7500, 22, 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80')
ON CONFLICT DO NOTHING;
