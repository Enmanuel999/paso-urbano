-- Ejecutar una vez desde MySQL Workbench sobre la instalación existente.
-- Conserva los IDs de los productos para no romper referencias de bolsas y pedidos.
UPDATE paso_catalog.products SET
  name = CASE id
    WHEN 'urbano-nova' THEN 'Air Force 1 ''07'
    WHEN 'retro-court' THEN 'Air Max 90'
    WHEN 'trail-pulse' THEN 'Dunk Low Retro'
    WHEN 'daily-cloud' THEN 'Air Jordan 1 Low'
    WHEN 'canvas-sun' THEN 'Samba OG'
    WHEN 'urban-echo' THEN 'Superstar'
    WHEN 'terra-hike' THEN 'Gazelle Indoor'
    WHEN 'bloom-step' THEN 'Campus 00s' ELSE name END,
  brand = CASE id
    WHEN 'urbano-nova' THEN 'Nike' WHEN 'retro-court' THEN 'Nike'
    WHEN 'trail-pulse' THEN 'Nike' WHEN 'daily-cloud' THEN 'Jordan'
    WHEN 'canvas-sun' THEN 'adidas' WHEN 'urban-echo' THEN 'adidas'
    WHEN 'terra-hike' THEN 'adidas' WHEN 'bloom-step' THEN 'adidas' ELSE brand END,
  category = CASE id
    WHEN 'urbano-nova' THEN 'Urbano' WHEN 'retro-court' THEN 'Deportivo'
    WHEN 'trail-pulse' THEN 'Urbano' WHEN 'daily-cloud' THEN 'Urbano'
    WHEN 'canvas-sun' THEN 'Casual' WHEN 'urban-echo' THEN 'Urbano'
    WHEN 'terra-hike' THEN 'Casual' WHEN 'bloom-step' THEN 'Urbano' ELSE category END,
  description = CASE id
    WHEN 'urbano-nova' THEN 'El clásico de baloncesto de Nike, con perfil bajo y amortiguación Air.'
    WHEN 'retro-court' THEN 'Silueta de running de los 90 con amortiguación visible Air.'
    WHEN 'trail-pulse' THEN 'Diseño de cancha de los años 80 con bloques de color y suela de goma.'
    WHEN 'daily-cloud' THEN 'Versión baja del modelo Jordan 1, inspirado en el baloncesto clásico.'
    WHEN 'canvas-sun' THEN 'Clásico de fútbol sala con puntera en T, franjas y suela de goma.'
    WHEN 'urban-echo' THEN 'Modelo icónico de baloncesto con puntera de caucho tipo concha.'
    WHEN 'terra-hike' THEN 'Silueta clásica de ante con suela de goma translúcida.'
    WHEN 'bloom-step' THEN 'Inspirado en el baloncesto de archivo, con proporciones robustas.' ELSE description END,
  price = CASE id
    WHEN 'urbano-nova' THEN 519900 WHEN 'retro-court' THEN 589900
    WHEN 'trail-pulse' THEN 499900 WHEN 'daily-cloud' THEN 549900
    WHEN 'canvas-sun' THEN 469900 WHEN 'urban-echo' THEN 449900
    WHEN 'terra-hike' THEN 459900 WHEN 'bloom-step' THEN 479900 ELSE price END,
  image = CASE id
    WHEN 'urbano-nova' THEN '/images/shoes/nike-air-force-1.jpg'
    WHEN 'retro-court' THEN '/images/shoes/nike-air-max-90.jpg'
    WHEN 'trail-pulse' THEN '/images/shoes/nike-dunk-low.jpg'
    WHEN 'daily-cloud' THEN '/images/shoes/air-jordan-1-low.png'
    WHEN 'canvas-sun' THEN '/images/shoes/adidas-samba-og.jpg'
    WHEN 'urban-echo' THEN '/images/shoes/adidas-superstar.jpg'
    WHEN 'terra-hike' THEN '/images/shoes/adidas-gazelle-indoor.png'
    WHEN 'bloom-step' THEN '/images/shoes/adidas-campus-00s.jpg' ELSE image END
WHERE id IN ('urbano-nova','retro-court','trail-pulse','daily-cloud','canvas-sun','urban-echo','terra-hike','bloom-step');

-- Refresca los artículos que ya estén guardados en bolsas. Los pedidos históricos conservan su descripción original.
UPDATE paso_orders.cart_items AS cart
JOIN paso_catalog.products AS product ON product.id = cart.product_id
SET cart.name = product.name, cart.brand = product.brand, cart.image = product.image
WHERE cart.id > 0
  AND cart.product_id IN (
    'urbano-nova', 'retro-court', 'trail-pulse', 'daily-cloud',
    'canvas-sun', 'urban-echo', 'terra-hike', 'bloom-step'
  );

CREATE TABLE IF NOT EXISTS paso_catalog.product_images (
  product_id VARCHAR(60) NOT NULL,
  position TINYINT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(180) NOT NULL,
  PRIMARY KEY (product_id, position),
  UNIQUE KEY uq_product_image_path (product_id, image_path),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES paso_catalog.products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DELETE FROM paso_catalog.product_images
WHERE product_id IN ('urbano-nova','retro-court','trail-pulse','daily-cloud','canvas-sun','urban-echo','terra-hike','bloom-step');

INSERT INTO paso_catalog.product_images (product_id,position,image_path,alt_text) VALUES
('urbano-nova',2,'/images/shoes/nike-air-force-1-detail.jpg','Nike Air Force 1 ''07 — segunda vista'),
('retro-court',2,'/images/shoes/nike-air-max-90-detail.jpg','Nike Air Max 90 — segunda vista'),
('trail-pulse',2,'/images/shoes/nike-dunk-low-detail.jpg','Nike Dunk Low Retro — segunda vista'),
('daily-cloud',2,'/images/shoes/air-jordan-1-low-detail.jpg','Air Jordan 1 Low — segunda vista'),
('canvas-sun',2,'/images/shoes/adidas-samba-og-detail.png','adidas Samba OG — segunda vista'),
('urban-echo',2,'/images/shoes/adidas-superstar-detail.jpg','adidas Superstar — segunda vista'),
('terra-hike',2,'/images/shoes/adidas-gazelle-indoor-detail.jpg','adidas Gazelle Indoor — segunda vista'),
('bloom-step',2,'/images/shoes/adidas-campus-00s-detail.jpg','adidas Campus 00s — segunda vista');
