import { createMySqlPool } from '../shared/mysql.js';
import { createUserRepository } from './adapters/mysqlRepository.js';
import { createUserUseCases } from './application/useCases.js';
import { createUsersServer } from './adapters/httpServer.js';

const pool = createMySqlPool(process.env.MYSQL_USERS_DATABASE || 'paso_users');
try {
  await pool.query('SELECT id FROM users LIMIT 0');
  const server = createUsersServer({ useCases: createUserUseCases(createUserRepository(pool)), port: Number(process.env.USERS_PORT || 3103) });
  const stop = () => server.close(async () => { await pool.end(); process.exit(0); });
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  server.on('error', async (error) => { console.error(`[usuarios] ${error.message}`); await pool.end(); process.exit(1); });
} catch (error) {
  console.error(`[usuarios] No se pudo iniciar. Revisa el esquema MySQL paso_users: ${error.message}`);
  await pool.end(); process.exit(1);
}
