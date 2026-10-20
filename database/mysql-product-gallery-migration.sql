-- Ejecutar una vez en MySQL Workbench para agregar galerías a una base existente.
CREATE TABLE IF NOT EXISTS paso_catalog.product_images (
  product_id VARCHAR(60) NOT NULL,
  position TINYINT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(180) NOT NULL,
  PRIMARY KEY (product_id, position),
  UNIQUE KEY uq_product_image_path (product_id, image_path),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES paso_catalog.products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO paso_catalog.product_images (product_id,position,image_path,alt_text) VALUES
('urbano-nova',2,'/images/shoes/nova-street-detail.jpg','Nova Street — vista de detalle'),
('retro-court',2,'/images/shoes/court-retro-detail.jpg','Court Retro — vista de detalle'),
('trail-pulse',2,'/images/shoes/pulse-trail-detail.jpg','Pulse Trail — vista de detalle'),
('daily-cloud',2,'/images/shoes/daily-cloud-detail.jpg','Daily Cloud — vista de detalle'),
('canvas-sun',2,'/images/shoes/canvas-sun-detail.jpg','Canvas Sun — vista de detalle'),
('urban-echo',2,'/images/shoes/urban-echo-detail.jpg','Urban Echo — vista de detalle'),
('terra-hike',2,'/images/shoes/terra-hike-detail.jpg','Terra Hike — vista de detalle'),
('bloom-step',2,'/images/shoes/bloom-step-detail.jpg','Bloom Step — vista de detalle');
