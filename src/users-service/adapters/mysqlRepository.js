import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { User } from '../domain/User.js';
import { UserRepository } from '../application/ports/UserRepository.js';
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export class MySqlUserRepository extends UserRepository {
  constructor(pool) { super(); this.pool = pool; }
  async createSession(user) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await this.pool.execute('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)', [hashToken(token), user.id, expiresAt]);
    return { token, expiresAt: new Date(expiresAt).toISOString(), user: { id: user.id, name: user.name, email: user.email } };
  }
  async register(input) {
    const data = input;
    const salt = randomBytes(16).toString('hex');
    const passwordHash = pbkdf2Sync(data.password, salt, 120000, 32, 'sha256').toString('hex');
    try {
      const [result] = await this.pool.execute('INSERT INTO users(name,email,salt,password_hash) VALUES(?,?,?,?)', [data.name, data.email, salt, passwordHash]);
      return this.createSession(new User({ id: Number(result.insertId), name: data.name, email: data.email }));
    } catch (error) { if (error.code === 'ER_DUP_ENTRY') throw new Error('Ese correo ya tiene una cuenta.'); throw error; }
  }
  async login({ email, password }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    const row = rows[0];
    const candidate = row ? Buffer.from(pbkdf2Sync(String(password || ''), row.salt, 120000, 32, 'sha256').toString('hex'), 'hex') : Buffer.alloc(32);
    if (!row || !timingSafeEqual(candidate, Buffer.from(row.password_hash, 'hex'))) throw new Error('Correo o contraseña incorrectos.');
    return this.createSession(new User({ id: Number(row.id), name: row.name, email: row.email }));
  }
  async getUser(token) {
    if (!token) return null;
    const [rows] = await this.pool.execute('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', [hashToken(token), Date.now()]);
    const row = rows[0];
    return row ? new User({ id: Number(row.id), name: row.name, email: row.email }) : null;
  }
}

export function createUserRepository(pool) { return new MySqlUserRepository(pool); }
