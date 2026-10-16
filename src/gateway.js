import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { sendJson } from './shared/http.js';

const publicRoot = resolve('public');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const routes = [
  { prefix: '/api/products', target: process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:3101', base: '/products' },
  { prefix: '/api/catalog', target: process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:3101', base: '' },
  { prefix: '/api/users', target: process.env.USERS_SERVICE_URL || 'http://127.0.0.1:3103', base: '' },
  { prefix: '/api/orders', target: process.env.ORDERS_SERVICE_URL || 'http://127.0.0.1:3102', base: '/orders' },
];
export function createGateway({ port = 3000 } = {}) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/health') return sendJson(res, 200, { service: 'gateway', status: 'ok' });
    if (url.pathname.startsWith('/api/')) {
      const route = routes.find((item) => url.pathname.startsWith(item.prefix));
      if (!route) return sendJson(res, 404, { error: 'Ruta no disponible.' });
      const suffix = url.pathname.slice(route.prefix.length);
      const path = `${route.base}${suffix === '/' ? '' : suffix}`;
      try {
        const chunks = [];
        if (!['GET', 'HEAD'].includes(req.method)) for await (const chunk of req) chunks.push(chunk);
        const upstream = await fetch(`${route.target}${path}${url.search}`, {
          method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json', ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}) },
          body: chunks.length ? Buffer.concat(chunks) : undefined,
        });
        res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8' });
        return res.end(Buffer.from(await upstream.arrayBuffer()));
      } catch { return sendJson(res, 502, { error: 'No se pudo conectar con el servicio. Revisa que todos estén encendidos.' }); }
    }
    const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (relative.includes('..') || relative.includes('\\')) return sendJson(res, 400, { error: 'Ruta inválida.' });
    try {
      const file = await readFile(resolve(publicRoot, relative));
      res.writeHead(200, { 'content-type': mime[extname(relative)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      return res.end(file);
    } catch { return sendJson(res, 404, { error: 'Página no encontrada.' }); }
  }).listen(port, () => console.log(`Paso Urbano disponible en http://localhost:${port}`));
}

