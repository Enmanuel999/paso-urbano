import { createServer } from 'node:http';
import { sendJson, readJson } from '../../shared/http.js';

export function createOrdersServer({ useCases, port = 3102 }) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    try {
      if (req.method === 'GET' && url.pathname === '/health') return sendJson(res, 200, { service: 'orders', status: 'ok' });
      let match = url.pathname.match(/^\/orders\/carts\/([0-9a-f-]+)$/i);
      if (req.method === 'GET' && match) return sendJson(res, 200, await useCases.getCart(match[1]));
      match = url.pathname.match(/^\/orders\/carts\/([0-9a-f-]+)\/items$/i);
      if (req.method === 'PUT' && match) return sendJson(res, 200, await useCases.setCartItem(match[1], await readJson(req)));
      match = url.pathname.match(/^\/orders\/carts\/([0-9a-f-]+)\/items\/([\w-]+)\/([\w-]+)$/i);
      if (req.method === 'DELETE' && match) return sendJson(res, 200, await useCases.removeCartItem(match[1], match[2], match[3]));
      if (req.method === 'POST' && url.pathname === '/orders') return sendJson(res, 201, await useCases.createOrder(await readJson(req)));
      match = url.pathname.match(/^\/orders\/([\w-]+)$/);
      if (req.method === 'GET' && match) {
        const order = await useCases.getOrder(match[1]);
        return order ? sendJson(res, 200, order) : sendJson(res, 404, { error: 'Pedido no encontrado.' });
      }
      return sendJson(res, 404, { error: 'Ruta de pedidos no encontrada.' });
    } catch (error) { return sendJson(res, 400, { error: error.message || 'No se pudo procesar la solicitud.' }); }
  }).listen(port, () => console.log(`Pedidos escuchando en http://localhost:${port}`));
}
