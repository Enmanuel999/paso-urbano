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
CREATE TABLE IF NOT EXISTS variants (
  product_id VARCHAR(60) NOT NULL,
  size VARCHAR(8) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
INSERT IGNORE INTO products (id,name,brand,category,description,price,image) VALUES
('urbano-nova','Nova Street','Norte','Urbano','Silueta ligera para recorrer la ciudad con comodidad.',289900,'/images/shoes/nova-street.jpg'),
('retro-court','Court Retro','Cancha','Casual','Un clásico limpio con detalles en contraste y suela flexible.',319900,'/images/shoes/court-retro.jpg'),
('trail-pulse','Pulse Trail','Cumbre','Deportivo','Agarre confiable y amortiguación suave para tus rutas.',429900,'/images/shoes/pulse-trail.jpg'),
('daily-cloud','Daily Cloud','Norte','Deportivo','Malla respirable y pisada liviana para todos los días.',359900,'/images/shoes/daily-cloud.jpg'),
('canvas-sun','Canvas Sun','Lona Viva','Casual','Lona resistente con un perfil versátil para combinar.',199900,'/images/shoes/canvas-sun.jpg'),
('urban-echo','Urban Echo','Cancha','Urbano','Capas suaves y una suela urbana con buen soporte.',339900,'/images/shoes/urban-echo.jpg'),
('terra-hike','Terra Hike','Cumbre','Outdoor','Protección ligera para escapadas y senderos de fin de semana.',489900,'/images/shoes/terra-hike.jpg'),
('bloom-step','Bloom Step','Lona Viva','Casual','Un toque de color con plantilla acolchada y flexible.',249900,'/images/shoes/bloom-step.png');
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
