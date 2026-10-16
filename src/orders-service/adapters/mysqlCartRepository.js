import { Cart } from '../domain/Cart.js';
import { CartRepository } from '../application/ports/CartRepository.js';

export class MySqlCartRepository extends CartRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async getCart(cartId) {
    await this.pool.execute(
      'INSERT INTO carts(cart_id) VALUES(?) ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP',
      [cartId],
    );
    const [items] = await this.pool.execute(
      `SELECT product_id AS productId,name,brand,image,size,quantity,unit_price AS price
       FROM cart_items WHERE cart_id=? ORDER BY id`,
      [cartId],
    );
    return {
      cartId,
      items: items.map((item) => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) })),
    };
  }

  async setCartItem(cartId, item) {
    Cart.assertQuantity(item.quantity);
    await this.pool.execute(
      'INSERT INTO carts(cart_id) VALUES(?) ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP',
      [cartId],
    );
    await this.pool.execute(
      `INSERT INTO cart_items(cart_id,product_id,name,brand,image,size,quantity,unit_price)
       VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),brand=VALUES(brand),image=VALUES(image),quantity=VALUES(quantity),unit_price=VALUES(unit_price)`,
      [cartId, item.productId, item.name, item.brand, item.image, String(item.size), item.quantity, item.price],
    );
    return this.getCart(cartId);
  }

  async removeCartItem(cartId, productId, size) {
    await this.pool.execute(
      'DELETE FROM cart_items WHERE cart_id=? AND product_id=? AND size=?',
      [cartId, productId, String(size)],
    );
    await this.pool.execute('UPDATE carts SET updated_at=CURRENT_TIMESTAMP WHERE cart_id=?', [cartId]);
    return this.getCart(cartId);
  }
}

export function createCartRepository(pool) {
  return new MySqlCartRepository(pool);
}
