import { createMySqlPool } from '../shared/mysql.js';
import { createCatalogRepository } from './adapters/mysqlRepository.js';
import { createCatalogUseCases } from './application/useCases.js';
import { createCatalogServer } from './adapters/httpServer.js';

const pool = createMySqlPool(process.env.MYSQL_CATALOG_DATABASE || 'paso_catalog');
try {
  await pool.query('SELECT id FROM products LIMIT 0');
  const server = createCatalogServer({ useCases: createCatalogUseCases(createCatalogRepository(pool)), port: Number(process.env.CATALOG_PORT || 3101) });
  const stop = () => server.close(async () => { await pool.end(); process.exit(0); });
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  server.on('error', async (error) => { console.error(`[catálogo] ${error.message}`); await pool.end(); process.exit(1); });
} catch (error) {
  console.error(`[catálogo] No se pudo iniciar. Revisa el esquema MySQL paso_catalog: ${error.message}`);
  await pool.end(); process.exit(1);
}
