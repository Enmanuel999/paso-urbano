-- Ejecutar una vez desde MySQL Workbench sobre la instalación existente.
USE paso_catalog;
ALTER TABLE products ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
USE paso_users;
CREATE TABLE IF NOT EXISTS admins (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  salt CHAR(32) NOT NULL,
  password_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  admin_id TINYINT UNSIGNED NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_sessions_expiry (expires_at)
) ENGINE=InnoDB;
