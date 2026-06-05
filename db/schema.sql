-- ================================================================
--  Jean Baby – E-Commerce Platform
--  Database Script | CAT-23708/2024 | Rwanda
-- ================================================================

CREATE DATABASE IF NOT EXISTS jeanbaby
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE jeanbaby;

-- ----------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  names         VARCHAR(150)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('buyer','seller') NOT NULL DEFAULT 'buyer',
  phone         VARCHAR(20)   DEFAULT NULL,
  address       TEXT          DEFAULT NULL,
  profile_image VARCHAR(500)  DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(100) NOT NULL,
  description TEXT         DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  seller_id    INT           NOT NULL,
  category_id  INT           DEFAULT NULL,
  name         VARCHAR(200)  NOT NULL,
  description  TEXT          DEFAULT NULL,
  price        DECIMAL(10,2) NOT NULL,
  stock        INT           NOT NULL DEFAULT 0,
  image_url    VARCHAR(500)  DEFAULT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id)   REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- CART ITEMS (per user, no separate cart table)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT           NOT NULL,
  status           ENUM('pending','processing','shipped','delivered','cancelled')
                   NOT NULL DEFAULT 'pending',
  shipping_name    VARCHAR(150)  DEFAULT NULL,
  shipping_phone   VARCHAR(20)   DEFAULT NULL,
  shipping_address TEXT          DEFAULT NULL,
  notes            TEXT          DEFAULT NULL,
  payment_method   VARCHAR(50)   DEFAULT 'cash_on_delivery',
  total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- ORDER ITEMS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT           NOT NULL,
  product_id INT           NOT NULL,
  quantity   INT           NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================================================================
-- SEED DATA
-- ================================================================

-- Categories
INSERT INTO categories (label, description) VALUES
('Clothing',  'Soft, organic clothing for newborns to toddlers.'),
('Sleep',     'Sleep sacks, cribs and bedtime essentials.'),
('Feeding',   'Bottles, bibs, high chairs and meal-time essentials.'),
('Toys',      'Educational and sensory toys for every stage.'),
('Safety',    'Baby monitors, thermometers, and safety gear.');

-- Seller account (password: password123)
INSERT INTO users (names, email, password_hash, role) VALUES
('Jean Baby Store', 'seller@jeanbaby.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller');

-- Buyer demo account (password: password123)
INSERT INTO users (names, email, password_hash, role) VALUES
('Amina Uwase', 'buyer@jeanbaby.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'buyer');

-- Products (seller_id = 1)
INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url) VALUES
(1, 1, 'Organic Cotton Onesie',      'Ultra-soft certified organic cotton onesie for 0–3 months. Free from harmful chemicals, gentle on newborn skin.', 4500, 25, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80'),
(1, 2, 'Bamboo Sleep Sack',          'Temperature-regulating bamboo sleep sack with smooth zip closure. Keeps baby comfortable all night.', 8900, 15, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'),
(1, 3, 'Anti-Colic Feeding Bottle',  '260ml wide-neck bottle with soft silicone nipple that mimics breastfeeding. Advanced anti-colic valve.', 5200, 40, 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&q=80'),
(1, 3, 'Silicone Bib Set (3-pack)',  'Waterproof, dishwasher-safe silicone bibs with deep catch pocket. Adjustable neck, fits 6 months+.', 2800, 30, 'https://images.unsplash.com/photo-1590737976076-ad1e4c291cec?w=600&q=80'),
(1, 4, 'Sensory Activity Cube',      'Six-sided wooden activity cube with shapes, mirrors, and spinning gears. Develops fine motor skills.', 12500, 10, 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80'),
(1, 4, 'Wooden Stacking Rings',      'FSC-certified beechwood stacking rings in pastel colours. Teaches size discrimination. Ages 6 months+.', 6700, 20, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80'),
(1, 5, 'Baby Monitor Pro',           '1080p HD baby monitor with night vision, two-way audio, and temperature sensor. 300m range.', 24000, 8, 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80'),
(1, 5, 'Digital Ear Thermometer',    'Accurate reading in 1 second. Stores 20 readings. Fever alarm and colour-coded display for easy reading.', 7500, 22, 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80');
