import { createServer } from 'node:http';
import { sendJson, readJson } from '../../shared/http.js';

export function createUsersServer({ useCases, port = 3103 }) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    try {
      if (req.method === 'GET' && url.pathname === '/health') return sendJson(res, 200, { service: 'users', status: 'ok' });
      if (req.method === 'POST' && url.pathname === '/register') return sendJson(res, 201, await useCases.register(await readJson(req)));
      if (req.method === 'POST' && url.pathname === '/login') return sendJson(res, 200, await useCases.login(await readJson(req)));
      if (req.method === 'GET' && url.pathname === '/me') {
        const user = await useCases.profile((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
        return user ? sendJson(res, 200, { user }) : sendJson(res, 401, { error: 'Inicia sesión para ver tu perfil.' });
      }
      return sendJson(res, 404, { error: 'Ruta de usuarios no encontrada.' });
    } catch (error) { return sendJson(res, 400, { error: error.message || 'No se pudo procesar la solicitud.' }); }
  }).listen(port, () => console.log(`Usuarios escuchando en http://localhost:${port}`));
}


