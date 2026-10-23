export class Admin {
  static validateCredentials({ username, password }) {
    const normalized = String(username || '').trim();
    if (!normalized || typeof password !== 'string' || !password) throw new Error('Escribe el usuario y la contraseña.');
    return { username: normalized, password };
  }
}
