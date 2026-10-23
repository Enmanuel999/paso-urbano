import { createExpressApp, addJsonErrorHandler, addJsonNotFoundHandler } from '../../shared/expressApp.js';

const loginAttempts = new Map();
export function createUsersServer({ useCases, adminUseCases, port = 3103 }) {
  const app = createExpressApp();
  app.post('/admin/login', async (req, res) => {
    const ip = req.socket.remoteAddress || 'unknown';
    const attempt = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
    if (attempt.resetAt <= Date.now()) { attempt.count = 0; attempt.resetAt = Date.now() + 15 * 60 * 1000; }
    if (attempt.count >= 5) return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos y vuelve a intentarlo.' });
    try {
      const result = await adminUseCases.login(req.body || {});
      loginAttempts.delete(ip);
      return res.json(result);
    } catch (error) {
      attempt.count++;
      loginAttempts.set(ip, attempt);
      throw error;
    }
  });
  app.get('/admin/me', async (req, res) => {
    const admin = await adminUseCases.profile((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    return admin ? res.json({ admin }) : res.status(401).json({ error: 'Tu sesión de administrador venció. Inicia sesión otra vez.' });
  });
  app.post('/admin/logout', async (req, res) => {
    res.json(await adminUseCases.logout((req.headers.authorization || '').replace(/^Bearer\s+/i, '')));
  });
  app.get('/health', (req, res) => res.json({ service: 'users', status: 'ok' }));
  app.post('/register', async (req, res) => res.status(201).json(await useCases.register(req.body || {})));
  app.post('/login', async (req, res) => res.json(await useCases.login(req.body || {})));
  app.get('/me', async (req, res) => {
    const user = await useCases.profile((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    return user ? res.json({ user }) : res.status(401).json({ error: 'Inicia sesión para ver tu perfil.' });
  });
  addJsonNotFoundHandler(app, 'Ruta de usuarios no encontrada.');
  addJsonErrorHandler(app, 'No se pudo procesar la solicitud.');
  return app.listen(port, () => console.log(`Usuarios escuchando en http://localhost:${port}`));
}