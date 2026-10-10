import { randomUUID } from 'node:crypto';

export function createOrderRepository(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL, payment_status TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL, name TEXT NOT NULL, brand TEXT NOT NULL, size TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price INTEGER NOT NULL);`);
  return {
    create({ customerName, customerEmail, items }) {
      const id = `PU-${randomUUID().slice(0, 8).toUpperCase()}`;
      const dbItems = [];
      let total = 0;
      for (const item of items) {
        if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 10 || !Number.isInteger(Number(item.unitPrice)) || Number(item.unitPrice) < 1) throw new Error('Hay un producto inválido en el carrito.');
        const quantity = Number(item.quantity), unitPrice = Number(item.unitPrice);
        total += quantity * unitPrice;
        dbItems.push({ ...item, quantity, unitPrice });
      }
      total += total >= 350000 ? 0 : 14000;
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO orders VALUES(?,?,?,?,?,?,?)').run(id, customerName, customerEmail, total, 'Confirmado', 'Aprobado (simulado)', new Date().toISOString());
        const insert = db.prepare('INSERT INTO order_items(order_id,product_id,name,brand,size,quantity,unit_price) VALUES(?,?,?,?,?,?,?)');
        for (const item of dbItems) insert.run(id, item.productId, item.name, item.brand || '', String(item.size), item.quantity, item.unitPrice);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      return this.findById(id);
    },
    findById(id) {
      const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
      if (!order) return null;
      return { ...order, items: db.prepare('SELECT product_id AS productId,name,brand,size,quantity,unit_price AS unitPrice FROM order_items WHERE order_id=?').all(id) };
    },
  };
}

