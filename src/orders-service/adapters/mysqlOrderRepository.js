import { randomUUID } from 'node:crypto';
import { Order } from '../domain/Order.js';
import { OrderRepository } from '../application/ports/OrderRepository.js';

export class MySqlOrderRepository extends OrderRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async create({ cartId, customerName, customerEmail, items }) {
    const id = `PU-${randomUUID().slice(0, 8).toUpperCase()}`;
    const total = Order.totalFor(items);
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.execute(
        'INSERT INTO orders(id,customer_name,customer_email,total,status,payment_status) VALUES(?,?,?,?,?,?)',
        [id, customerName, customerEmail, total, 'Confirmado', 'Aprobado (simulado)'],
      );
      for (const item of items) {
        await connection.execute(
          'INSERT INTO order_items(order_id,product_id,name,brand,size,quantity,unit_price) VALUES(?,?,?,?,?,?,?)',
          [id, item.productId, item.name, item.brand || '', String(item.size), Number(item.quantity), Number(item.unitPrice)],
        );
      }
      await connection.execute('DELETE FROM cart_items WHERE cart_id=?', [cartId]);
      await connection.execute('UPDATE carts SET updated_at=CURRENT_TIMESTAMP WHERE cart_id=?', [cartId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return {
      id,
      customer_name: customerName,
      customer_email: customerEmail,
      total,
      status: 'Confirmado',
      payment_status: 'Aprobado (simulado)',
      created_at: new Date().toISOString(),
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        brand: item.brand || '',
        size: String(item.size),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };
  }

  async findById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM orders WHERE id=?', [id]);
    const order = rows[0];
    if (!order) return null;

    const [items] = await this.pool.execute(
      'SELECT product_id AS productId,name,brand,size,quantity,unit_price AS unitPrice FROM order_items WHERE order_id=?',
      [id],
    );
    return {
      ...order,
      total: Number(order.total),
      items: items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
    };
  }
}

export function createOrderRepository(pool) {
  return new MySqlOrderRepository(pool);
}
