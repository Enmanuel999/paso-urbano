import { createMySqlPool } from '../shared/mysql.js';
import { createCartRepository } from './adapters/mysqlCartRepository.js';
import { createOrderRepository } from './adapters/mysqlOrderRepository.js';
import { createHttpCatalogClient } from './adapters/httpCatalogClient.js';
import { createCartUseCases, createOrderUseCases } from './application/useCases.js';
import { createOrdersServer } from './adapters/httpServer.js';

const pool = createMySqlPool(process.env.MYSQL_ORDERS_DATABASE || 'paso_orders');
try {
  await pool.query('SELECT cart_id FROM carts LIMIT 0');
  await pool.query('SELECT id FROM orders LIMIT 0');
  const cartRepository = createCartRepository(pool);
  const orderRepository = createOrderRepository(pool);
  const catalogClient = createHttpCatalogClient(
    process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:3101',
    process.env.CATALOG_INTERNAL_TOKEN || '',
  );
  const useCases = {
    ...createCartUseCases({ cartRepository, catalogClient }),
    ...createOrderUseCases({ cartRepository, orderRepository, catalogClient }),
  };
  const server = createOrdersServer({ useCases, port: Number(process.env.ORDERS_PORT || 3102) });
  const stop = () => server.close(async () => { await pool.end(); process.exit(0); });
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  server.on('error', async (error) => { console.error(`[pedidos] ${error.message}`); await pool.end(); process.exit(1); });
} catch (error) {
  console.error(`[pedidos] No se pudo iniciar. Revisa paso_orders y ejecuta la migración de bolsa: ${error.message}`);
  await pool.end(); process.exit(1);
}
