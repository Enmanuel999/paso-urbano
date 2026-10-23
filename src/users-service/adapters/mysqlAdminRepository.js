import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { AdminRepository } from '../application/ports/AdminRepository.js';
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
export class MySqlAdminRepository extends AdminRepository {
  constructor(pool) { super(); this.pool = pool; }
  async configure(username, password) {
    if (!username && !password) return false;
    if (!username || typeof password !== 'string' || password.length < 16) throw new Error('Configura ADMIN_USERNAME y una ADMIN_PASSWORD de al menos 16 caracteres en .env.');
    if (username.trim().length < 3 || username.trim().length > 40) throw new Error('ADMIN_USERNAME debe tener entre 3 y 40 caracteres.');
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex');
    await this.pool.execute('INSERT INTO admins (id, username, salt, password_hash) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE username=VALUES(username), salt=VALUES(salt), password_hash=VALUES(password_hash)', [username.trim(), salt, hash]);
    await this.pool.execute('DELETE FROM admin_sessions WHERE admin_id=1');
    return true;
  }
  async login({ username, password }) {
    const [rows] = await this.pool.execute('SELECT id, username, salt, password_hash FROM admins WHERE id=1 AND username=?', [username]);
    const row = rows[0];
    const candidate = Buffer.from(pbkdf2Sync(password, row?.salt || '00000000000000000000000000000000', 210000, 32, 'sha256').toString('hex'), 'hex');
    const expected = Buffer.from(row?.password_hash || '0'.repeat(64), 'hex');
    if (!row || !timingSafeEqual(candidate, expected)) { const e=new Error('Usuario o contraseña incorrectos.'); e.statusCode=401; throw e; }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    await this.pool.execute('INSERT INTO admin_sessions(token_hash, admin_id, expires_at) VALUES(?, ?, ?)', [hashToken(token), row.id, expiresAt]);
    return { token, expiresAt: new Date(expiresAt).toISOString(), admin: { username: row.username } };
  }
  async getSession(token) {
    if (!token) return null;
    const [rows] = await this.pool.execute('SELECT a.username FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?', [hashToken(token), Date.now()]);
    return rows[0] ? { username: rows[0].username } : null;
  }
  async logout(token) { if (token) await this.pool.execute('DELETE FROM admin_sessions WHERE token_hash=?', [hashToken(token)]); return { loggedOut: true }; }
}
export function createAdminRepository(pool) { return new MySqlAdminRepository(pool); }
