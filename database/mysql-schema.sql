-- Paso Urbano: ejecutar este archivo completo desde MySQL Workbench.
-- Crea una base por microservicio para respetar sus límites de datos.
CREATE DATABASE IF NOT EXISTS paso_catalog CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS paso_orders CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS paso_users CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE paso_catalog;
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  category VARCHAR(40) NOT NULL,
  description VARCHAR(500) NOT NULL,
  price INT UNSIGNED NOT NULL,
  image VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS product_images (
  product_id VARCHAR(60) NOT NULL,
  position TINYINT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(180) NOT NULL,
  PRIMARY KEY (product_id, position),
  UNIQUE KEY uq_product_image_path (product_id, image_path),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS variants (
  product_id VARCHAR(60) NOT NULL,
  size VARCHAR(8) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
INSERT IGNORE INTO products (id,name,brand,category,description,price,image) VALUES
('urbano-nova','Air Force 1 ''07','Nike','Urbano','El clásico de baloncesto de Nike, con perfil bajo y amortiguación Air.',519900,'/images/shoes/nike-air-force-1.jpg'),
('retro-court','Air Max 90','Nike','Deportivo','Silueta de running de los 90 con amortiguación visible Air.',589900,'/images/shoes/nike-air-max-90.jpg'),
('trail-pulse','Dunk Low Retro','Nike','Urbano','Diseño de cancha de los años 80 con bloques de color y suela de goma.',499900,'/images/shoes/nike-dunk-low.jpg'),
('daily-cloud','Air Jordan 1 Low','Jordan','Urbano','Versión baja del modelo Jordan 1, inspirado en el baloncesto clásico.',549900,'/images/shoes/air-jordan-1-low.png'),
('canvas-sun','Samba OG','adidas','Casual','Clásico de fútbol sala con puntera en T, franjas y suela de goma.',469900,'/images/shoes/adidas-samba-og.jpg'),
('urban-echo','Superstar','adidas','Urbano','Modelo icónico de baloncesto con puntera de caucho tipo concha.',449900,'/images/shoes/adidas-superstar.jpg'),
('terra-hike','Gazelle Indoor','adidas','Casual','Silueta clásica de ante con suela de goma translúcida.',459900,'/images/shoes/adidas-gazelle-indoor.png'),
('bloom-step','Campus 00s','adidas','Urbano','Inspirado en el baloncesto de archivo, con proporciones robustas.',479900,'/images/shoes/adidas-campus-00s.jpg');
INSERT IGNORE INTO product_images (product_id,position,image_path,alt_text) VALUES
('urbano-nova',2,'/images/shoes/nike-air-force-1-detail.jpg','Nike Air Force 1 ''07 — segunda vista'),
('retro-court',2,'/images/shoes/nike-air-max-90-detail.jpg','Nike Air Max 90 — segunda vista'),
('trail-pulse',2,'/images/shoes/nike-dunk-low-detail.jpg','Nike Dunk Low Retro — segunda vista'),
('daily-cloud',2,'/images/shoes/air-jordan-1-low-detail.jpg','Air Jordan 1 Low — segunda vista'),
('canvas-sun',2,'/images/shoes/adidas-samba-og-detail.png','adidas Samba OG — segunda vista'),
('urban-echo',2,'/images/shoes/adidas-superstar-detail.jpg','adidas Superstar — segunda vista'),
('terra-hike',2,'/images/shoes/adidas-gazelle-indoor-detail.jpg','adidas Gazelle Indoor — segunda vista'),
('bloom-step',2,'/images/shoes/adidas-campus-00s-detail.jpg','adidas Campus 00s — segunda vista');
INSERT IGNORE INTO variants (product_id,size,stock) VALUES
('urbano-nova','36',4),('urbano-nova','37',6),('urbano-nova','38',5),('urbano-nova','39',3),('urbano-nova','40',2),
('retro-court','36',3),('retro-court','37',4),('retro-court','38',5),('retro-court','39',4),('retro-court','40',2),
('trail-pulse','37',2),('trail-pulse','38',5),('trail-pulse','39',5),('trail-pulse','40',4),('trail-pulse','41',2),
('daily-cloud','36',2),('daily-cloud','37',3),('daily-cloud','38',4),('daily-cloud','39',4),('daily-cloud','40',3),
('canvas-sun','35',4),('canvas-sun','36',5),('canvas-sun','37',5),('canvas-sun','38',3),('canvas-sun','39',2),
('urban-echo','37',3),('urban-echo','38',4),('urban-echo','39',5),('urban-echo','40',3),('urban-echo','41',2),
('terra-hike','38',2),('terra-hike','39',3),('terra-hike','40',4),('terra-hike','41',3),('terra-hike','42',2),
('bloom-step','35',3),('bloom-step','36',4),('bloom-step','37',4),('bloom-step','38',3),('bloom-step','39',2);

USE paso_users;
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  salt CHAR(32) NOT NULL,
  password_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

USE paso_orders;
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(40) PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(254) NOT NULL,
  total INT UNSIGNED NOT NULL,
  status VARCHAR(40) NOT NULL,
  payment_status VARCHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_email (customer_email)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(40) NOT NULL,
  product_id VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  size VARCHAR(8) NOT NULL,
  quantity TINYINT UNSIGNED NOT NULL,
  unit_price INT UNSIGNED NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bolsa persistente: estos DDL también permiten actualizar una instalación existente.
USE paso_orders;
CREATE TABLE IF NOT EXISTS carts (
  cart_id CHAR(36) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cart_id CHAR(36) NOT NULL,
  product_id VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  image VARCHAR(255) NOT NULL,
  size VARCHAR(8) NOT NULL,
  quantity TINYINT UNSIGNED NOT NULL,
  unit_price INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_cart_variant (cart_id, product_id, size),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE
) ENGINE=InnoDB;
