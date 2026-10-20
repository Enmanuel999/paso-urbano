import { createServer } from 'node:http';
import { sendJson, readJson } from '../../shared/http.js';

export function createCatalogServer({ useCases, port = 3101 }) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' }); return res.end(); }
    try {
      if (req.method === 'GET' && url.pathname === '/health') return sendJson(res, 200, { service: 'catalog', status: 'ok' });
      if (req.method === 'GET' && url.pathname === '/products') return sendJson(res, 200, { products: await useCases.listProducts(Object.fromEntries(url.searchParams)) });
      const match = url.pathname.match(/^\/products\/([\w-]+)$/);
      if (req.method === 'GET' && match) {
        const product = await useCases.getProduct(match[1]);
        return product ? sendJson(res, 200, product) : sendJson(res, 404, { error: 'Producto no encontrado.' });
      }
      if (req.method === 'POST' && ['/reserve', '/release'].includes(url.pathname)) {
        const internalToken = process.env.CATALOG_INTERNAL_TOKEN;
        if (!internalToken || req.headers['x-internal-token'] !== internalToken) {
          return sendJson(res, 404, { error: 'Ruta de catálogo no encontrada.' });
        }
        const { items = [] } = await readJson(req);
        if (!Array.isArray(items)) return sendJson(res, 400, { error: 'Los artículos deben enviarse en una lista.' });
        if (url.pathname === '/reserve') return sendJson(res, 200, await useCases.reserveStock(items));
        return sendJson(res, 200, await useCases.releaseStock(items));
      }
      return sendJson(res, 404, { error: 'Ruta de catálogo no encontrada.' });
    } catch (error) { return sendJson(res, 400, { error: error.message || 'No se pudo procesar la solicitud.' }); }
  }).listen(port, () => console.log(`Catálogo escuchando en http://localhost:${port}`));
}

