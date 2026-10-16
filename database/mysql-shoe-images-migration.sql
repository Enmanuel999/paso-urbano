-- Ejecutar una sola vez desde MySQL Workbench en una instalación existente.
-- Cambia las columnas para aceptar rutas de archivos y actualiza productos y bolsas guardadas.
ALTER TABLE paso_catalog.products MODIFY image VARCHAR(255) NOT NULL;
ALTER TABLE paso_orders.cart_items MODIFY image VARCHAR(255) NOT NULL;

UPDATE paso_catalog.products SET image = CASE id
  WHEN 'urbano-nova' THEN '/images/shoes/nova-street.jpg'
  WHEN 'retro-court' THEN '/images/shoes/court-retro.jpg'
  WHEN 'trail-pulse' THEN '/images/shoes/pulse-trail.jpg'
  WHEN 'daily-cloud' THEN '/images/shoes/daily-cloud.jpg'
  WHEN 'canvas-sun' THEN '/images/shoes/canvas-sun.jpg'
  WHEN 'urban-echo' THEN '/images/shoes/urban-echo.jpg'
  WHEN 'terra-hike' THEN '/images/shoes/terra-hike.jpg'
  WHEN 'bloom-step' THEN '/images/shoes/bloom-step.png'
  ELSE image
END
WHERE id IN ('urbano-nova','retro-court','trail-pulse','daily-cloud','canvas-sun','urban-echo','terra-hike','bloom-step');

UPDATE paso_orders.cart_items AS ci
JOIN paso_catalog.products AS p ON p.id = ci.product_id
SET ci.image = p.image;
