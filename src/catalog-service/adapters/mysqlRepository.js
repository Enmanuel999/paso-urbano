import { CatalogRepository } from '../application/ports/CatalogRepository.js';
import { Product } from '../domain/Product.js';

export class MySqlCatalogRepository extends CatalogRepository {
  constructor(pool) { super(); this.pool = pool; }
  async toProduct(row) {
    if (!row) return null;
    const [[variants], [gallery]] = await Promise.all([
      this.pool.execute('SELECT size, stock FROM variants WHERE product_id = ? ORDER BY size', [row.id]),
      this.pool.execute('SELECT image_path, alt_text FROM product_images WHERE product_id = ? ORDER BY position', [row.id]),
    ]);
    return new Product({ ...row, price: Number(row.price), images: gallery.map(({ image_path, alt_text }) => ({ src: image_path, alt: alt_text })), variants: variants.map((variant) => ({ ...variant, stock: Number(variant.stock) })) });
  }
  async list({ search = '', category = '', size = '' } = {}) {
    const [rows] = await this.pool.execute(`SELECT DISTINCT p.* FROM products p LEFT JOIN variants v ON v.product_id=p.id
      WHERE (? = '' OR lower(CONCAT(p.name, ' ', p.brand, ' ', p.description)) LIKE ?)
      AND (? = '' OR p.category = ?) AND (? = '' OR v.size = ? AND v.stock > 0) ORDER BY p.name`,
      [search, `%${String(search).toLowerCase()}%`, category, category, size, size]);
    return Promise.all(rows.map((row) => this.toProduct(row)));
  }
  async findById(id) { return this.toProduct((await this.pool.execute('SELECT * FROM products WHERE id = ?', [id]))[0][0]); }
  async reserve(items) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error('Cantidad inválida.');
        const [rows] = await connection.execute('SELECT stock FROM variants WHERE product_id = ? AND size = ? FOR UPDATE', [item.productId, String(item.size)]);
        if (!rows.length) throw new Error(`La talla ${item.size} ya no está disponible.`);
        if (Number(rows[0].stock) < quantity) throw new Error(`Stock insuficiente para talla ${item.size}.`);
        await connection.execute('UPDATE variants SET stock = stock - ? WHERE product_id = ? AND size = ?', [quantity, item.productId, String(item.size)]);
      }
      await connection.commit(); return { reserved: true };
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  }

  async release(items) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error('Cantidad inválida.');
        const [rows] = await connection.execute(
          'SELECT stock FROM variants WHERE product_id = ? AND size = ? FOR UPDATE',
          [item.productId, String(item.size)],
        );
        if (!rows.length) throw new Error(`No se encontró la variante de talla ${item.size} para devolver al inventario.`);
        await connection.execute(
          'UPDATE variants SET stock = stock + ? WHERE product_id = ? AND size = ?',
          [quantity, item.productId, String(item.size)],
        );
      }
      await connection.commit();
      return { released: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export function createCatalogRepository(pool) { return new MySqlCatalogRepository(pool); }
