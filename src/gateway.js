import { resolve } from 'node:path';
import express from 'express';
import { createExpressApp, addJsonErrorHandler, addJsonNotFoundHandler } from './shared/expressApp.js';

const publicRoot = resolve('public');
const routes = [
  { prefix: '/api/products', target: process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:3101', base: '/products' },
  { prefix: '/api/users', target: process.env.USERS_SERVICE_URL || 'http://127.0.0.1:3103', base: '' },
  { prefix: '/api/orders', target: process.env.ORDERS_SERVICE_URL || 'http://127.0.0.1:3102', base: '/orders' },
];

function targetUrl(req, prefix, base, target) {
  const incoming = new URL(req.originalUrl, 'http://localhost');
  const suffix = incoming.pathname.slice(prefix.length);
  const path = base + (suffix === '/' ? '' : suffix);
  return `${target.replace(/\/$/, '')}${path}${incoming.search}`;
}

async function forwardRequest(req, res, url, extraHeaders = {}) {
  const hasBody = !['GET', 'HEAD'].includes(req.method) && req.body !== undefined;
  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'] || 'application/json',
      ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
      ...extraHeaders,
    },
    body: hasBody ? JSON.stringify(req.body) : undefined,
  });
  const body = Buffer.from(await upstream.arrayBuffer());
  res.status(upstream.status);
  res.set('content-type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
  return res.send(body);
}

export function createGateway({ port = 3000 } = {}) {
  const app = createExpressApp();
  app.get('/health', (req, res) => res.json({ service: 'gateway', status: 'ok' }));

  app.use('/api/admin', async (req, res) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Inicia sesión como administrador.' });
    const usersUrl = process.env.USERS_SERVICE_URL || 'http://127.0.0.1:3103';
    const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:3101';
    try {
      const session = await fetch(`${usersUrl}/admin/me`, { headers: { authorization: `Bearer ${token}` } });
      if (!session.ok) return res.status(401).json({ error: 'Tu sesión de administrador venció. Inicia sesión otra vez.' });
      const incoming = new URL(req.originalUrl, 'http://localhost');
      const suffix = incoming.pathname.slice('/api/admin'.length);
      return await forwardRequest(
        req,
        res,
        `${catalogUrl.replace(/\/$/, '')}/admin${suffix}${incoming.search}`,
        { 'x-internal-token': process.env.CATALOG_INTERNAL_TOKEN || '' },
      );
    } catch {
      return res.status(502).json({ error: 'No se pudo conectar con Catálogo. Comprueba que los servicios estén iniciados.' });
    }
  });

  for (const route of routes) {
    app.use(route.prefix, async (req, res) => {
      try {
        return await forwardRequest(req, res, targetUrl(req, route.prefix, route.base, route.target));
      } catch {
        return res.status(502).json({ error: 'No se pudo conectar con el servicio. Revisa que todos estén encendidos.' });
      }
    });
  }

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no disponible.' }));
  app.use((req, res, next) => {
    if (req.path.includes('..') || req.path.includes('\\')) return res.status(400).json({ error: 'Ruta inválida.' });
    next();
  });
  app.use(express.static(publicRoot, {
    setHeaders(res) { res.setHeader('cache-control', 'no-cache'); },
  }));
  addJsonNotFoundHandler(app, 'Página no encontrada.');
  addJsonErrorHandler(app, 'No se pudo procesar la solicitud.');
  return app.listen(port, () => console.log(`Paso Urbano disponible en http://localhost:${port}`));
}