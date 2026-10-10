import { Product } from '../domain/Product.js';

const seed = [
  ['urbano-nova', 'Nova Street', 'Norte', 'Urbano', 'Silueta ligera para recorrer la ciudad con comodidad.', 289900, '👟', [['36', 4], ['37', 6], ['38', 5], ['39', 3], ['40', 2]]],
  ['retro-court', 'Court Retro', 'Cancha', 'Casual', 'Un clásico limpio con detalles en contraste y suela flexible.', 319900, '👟', [['36', 3], ['37', 4], ['38', 5], ['39', 4], ['40', 2]]],
  ['trail-pulse', 'Pulse Trail', 'Cumbre', 'Deportivo', 'Agarre confiable y amortiguación suave para tus rutas.', 429900, '🥾', [['37', 2], ['38', 5], ['39', 5], ['40', 4], ['41', 2]]],
  ['daily-cloud', 'Daily Cloud', 'Norte', 'Deportivo', 'Malla respirable y pisada liviana para todos los días.', 359900, '👟', [['36', 2], ['37', 3], ['38', 4], ['39', 4], ['40', 3]]],
  ['canvas-sun', 'Canvas Sun', 'Lona Viva', 'Casual', 'Lona resistente con un perfil versátil para combinar.', 199900, '👟', [['35', 4], ['36', 5], ['37', 5], ['38', 3], ['39', 2]]],
  ['urban-echo', 'Urban Echo', 'Cancha', 'Urbano', 'Capas suaves y una suela urbana con buen soporte.', 339900, '👟', [['37', 3], ['38', 4], ['39', 5], ['40', 3], ['41', 2]]],
  ['terra-hike', 'Terra Hike', 'Cumbre', 'Outdoor', 'Protección ligera para escapadas y senderos de fin de semana.', 489900, '🥾', [['38', 2], ['39', 3], ['40', 4], ['41', 3], ['42', 2]]],
  ['bloom-step', 'Bloom Step', 'Lona Viva', 'Casual', 'Un toque de color con plantilla acolchada y flexible.', 249900, '👟', [['35', 3], ['36', 4], ['37', 4], ['38', 3], ['39', 2]]],
];

export function createCatalogRepository(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, price INTEGER NOT NULL, image TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS variants (product_id TEXT NOT NULL REFERENCES products(id), size TEXT NOT NULL, stock INTEGER NOT NULL CHECK(stock >= 0), PRIMARY KEY(product_id, size));`);
  if (db.prepare('SELECT COUNT(*) AS count FROM products').get().count === 0) {
    const insert = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)');
    const variant = db.prepare('INSERT INTO variants VALUES (?, ?, ?)');
    for (const [id, name, brand, category, description, price, image, sizes] of seed) {
      insert.run(id, name, brand, category, description, price, image);
      for (const [size, stock] of sizes) variant.run(id, size, stock);
    }
  }

  function toProduct(row) {
    if (!row) return null;
    const variants = db.prepare('SELECT size, stock FROM variants WHERE product_id = ? ORDER BY size').all(row.id);
    return new Product({ ...row, variants });
  }
  return {
    list({ search = '', category = '', size = '' } = {}) {
      const rows = db.prepare(`SELECT DISTINCT p.* FROM products p LEFT JOIN variants v ON v.product_id=p.id
        WHERE (? = '' OR lower(p.name || ' ' || p.brand || ' ' || p.description) LIKE ?)
        AND (? = '' OR p.category = ?) AND (? = '' OR v.size = ? AND v.stock > 0) ORDER BY p.name`).all(
          search, `%${String(search).toLowerCase()}%`, category, category, size, size);
      return rows.map(toProduct);
    },
    findById(id) { return toProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)); },
    reserve(items) {
      const update = db.prepare('UPDATE variants SET stock = stock - ? WHERE product_id = ? AND size = ? AND stock >= ?');
      const read = db.prepare('SELECT stock FROM variants WHERE product_id = ? AND size = ?');
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const item of items) {
          if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new Error('Cantidad inválida.');
          const result = update.run(item.quantity, item.productId, String(item.size), item.quantity);
          if (result.changes !== 1) {
            const current = read.get(item.productId, String(item.size));
            throw new Error(current ? `Stock insuficiente para talla ${item.size}.` : `La talla ${item.size} ya no está disponible.`);
          }
        }
        db.exec('COMMIT');
        return { reserved: true };
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
}
