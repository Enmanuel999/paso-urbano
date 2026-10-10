import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function createUserRepository(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);`);
  return {
    register({ name, email, password }) {
      if (typeof name !== 'string' || name.trim().length < 2) throw new Error('Escribe tu nombre (mínimo 2 caracteres).');
      if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Escribe un correo válido.');
      if (typeof password !== 'string' || password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
      const salt = randomBytes(16).toString('hex');
      const passwordHash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
      try {
        const result = db.prepare('INSERT INTO users(name,email,salt,password_hash,created_at) VALUES(?,?,?,?,?)').run(name.trim(), email.toLowerCase().trim(), salt, passwordHash, new Date().toISOString());
        return this.login({ email, password, userId: Number(result.lastInsertRowid) });
      } catch (error) { if (String(error.message).includes('UNIQUE')) throw new Error('Ese correo ya tiene una cuenta.'); throw error; }
    },
    login({ email, password, userId = null }) {
      const user = userId ? db.prepare('SELECT * FROM users WHERE id = ?').get(userId) : db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase().trim());
      const candidate = user ? Buffer.from(pbkdf2Sync(String(password || ''), user.salt, 120000, 32, 'sha256').toString('hex'), 'hex') : Buffer.alloc(32);
      if (!user || !timingSafeEqual(candidate, Buffer.from(user.password_hash, 'hex'))) throw new Error('Correo o contraseña incorrectos.');
      const token = randomBytes(32).toString('base64url');
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hashToken(token), user.id, expiresAt);
      return { token, expiresAt: new Date(expiresAt).toISOString(), user: { id: user.id, name: user.name, email: user.email } };
    },
    getUser(token) {
      if (!token) return null;
      const row = db.prepare(`SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(hashToken(token), Date.now());
      return row || null;
    },
  };
}
