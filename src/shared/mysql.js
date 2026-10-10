import mysql from 'mysql2/promise';

export function createMySqlPool(database) {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 8,
    queueLimit: 0,
  });
}
