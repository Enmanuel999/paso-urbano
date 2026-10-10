export class User {
  constructor({ id, name, email }) {
    if (!id || typeof name !== 'string' || typeof email !== 'string') throw new Error('Usuario inválido.');
    Object.assign(this, { id, name, email });
  }
  static validateRegistration({ name, email, password }) {
    if (typeof name !== 'string' || name.trim().length < 2) throw new Error('Escribe tu nombre (mínimo 2 caracteres).');
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Escribe un correo válido.');
    if (typeof password !== 'string' || password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    return { name: name.trim(), email: email.trim().toLowerCase(), password };
  }
}
