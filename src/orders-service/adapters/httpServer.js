import { createExpressApp, addJsonErrorHandler, addJsonNotFoundHandler } from '../../shared/expressApp.js';

export function createOrdersServer({ useCases, port = 3102 }) {
  const app = createExpressApp();
  const validCartId = (value) => /^[0-9a-f-]+$/i.test(value);
  app.get('/health', (req, res) => res.json({ service: 'orders', status: 'ok' }));
  app.get('/orders/carts/:cartId', async (req, res, next) => {
    if (!validCartId(req.params.cartId)) return next();
    res.json(await useCases.getCart(req.params.cartId));
  });
  app.put('/orders/carts/:cartId/items', async (req, res, next) => {
    if (!validCartId(req.params.cartId)) return next();
    res.json(await useCases.setCartItem(req.params.cartId, req.body || {}));
  });
  app.delete('/orders/carts/:cartId/items/:productId/:size', async (req, res, next) => {
    if (!validCartId(req.params.cartId) || !/^[\w-]+$/.test(req.params.productId) || !/^[\w-]+$/.test(req.params.size)) return next();
    res.json(await useCases.removeCartItem(req.params.cartId, req.params.productId, req.params.size));
  });
  app.post('/orders', async (req, res) => {
    res.status(201).json(await useCases.createOrder(req.body || {}));
  });
  app.get('/orders/:orderId', async (req, res, next) => {
    if (!/^[\w-]+$/.test(req.params.orderId)) return next();
    const order = await useCases.getOrder(req.params.orderId);
    return order ? res.json(order) : res.status(404).json({ error: 'Pedido no encontrado.' });
  });
  addJsonNotFoundHandler(app, 'Ruta de pedidos no encontrada.');
  addJsonErrorHandler(app, 'No se pudo procesar la solicitud.');
  return app.listen(port, () => console.log(`Pedidos escuchando en http://localhost:${port}`));
}