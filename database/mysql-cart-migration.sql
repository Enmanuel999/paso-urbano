-- Migración para guardar la bolsa activa en MySQL antes del checkout.
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
  image VARCHAR(16) NOT NULL,
  size VARCHAR(8) NOT NULL,
  quantity TINYINT UNSIGNED NOT NULL,
  unit_price INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_cart_variant (cart_id, product_id, size),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE
) ENGINE=InnoDB;
