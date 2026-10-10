import { OrdersRepository } from '../application/ports/OrdersRepository.js';
import { Order } from '../domain/Order.js';
import { Cart } from '../domain/Cart.js';
import { randomUUID } from 'node:crypto';

export class MySqlOrdersRepository extends OrdersRepository {
  constructor(pool) { super(); this.pool = pool; }
  async getCart(cartId) {
    await this.pool.execute('INSERT INTO carts(cart_id) VALUES(?) ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP', [cartId]);
    const [items] = await this.pool.execute(`SELECT product_id AS productId,name,brand,image,size,quantity,unit_price AS price
      FROM cart_items WHERE cart_id=? ORDER BY id`, [cartId]);
    return { cartId, items: items.map((item) => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) })) };
  }
  async setCartItem(cartId, item) {
    Cart.assertQuantity(item.quantity);
    await this.pool.execute('INSERT INTO carts(cart_id) VALUES(?) ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP', [cartId]);
    await this.pool.execute(`INSERT INTO cart_items(cart_id,product_id,name,brand,image,size,quantity,unit_price)
      VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),brand=VALUES(brand),image=VALUES(image),quantity=VALUES(quantity),unit_price=VALUES(unit_price)`,
      [cartId, item.productId, item.name, item.brand, item.image, String(item.size), item.quantity, item.price]);
    return this.getCart(cartId);
  }
  async removeCartItem(cartId, productId, size) {
    await this.pool.execute('DELETE FROM cart_items WHERE cart_id=? AND product_id=? AND size=?', [cartId, productId, String(size)]);
    await this.pool.execute('UPDATE carts SET updated_at=CURRENT_TIMESTAMP WHERE cart_id=?', [cartId]);
    return this.getCart(cartId);
  }
  async create({ cartId, customerName, customerEmail, items }) {
    const id = `PU-${randomUUID().slice(0, 8).toUpperCase()}`;
    const total = Order.totalFor(items);
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT INTO orders(id,customer_name,customer_email,total,status,payment_status) VALUES(?,?,?,?,?,?)', [id, customerName, customerEmail, total, 'Confirmado', 'Aprobado (simulado)']);
      for (const item of items) await connection.execute('INSERT INTO order_items(order_id,product_id,name,brand,size,quantity,unit_price) VALUES(?,?,?,?,?,?,?)', [id, item.productId, item.name, item.brand || '', String(item.size), Number(item.quantity), Number(item.unitPrice)]);
      await connection.execute('DELETE FROM cart_items WHERE cart_id=?', [cartId]);
      await connection.execute('UPDATE carts SET updated_at=CURRENT_TIMESTAMP WHERE cart_id=?', [cartId]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    return this.findById(id);
  }
  async findById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM orders WHERE id=?', [id]);
    const order = rows[0]; if (!order) return null;
    const [items] = await this.pool.execute('SELECT product_id AS productId,name,brand,size,quantity,unit_price AS unitPrice FROM order_items WHERE order_id=?', [id]);
    return { ...order, total: Number(order.total), items: items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })) };
  }
}

export function createOrdersRepository(pool) { return new MySqlOrdersRepository(pool); }
