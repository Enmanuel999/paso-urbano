import { createExpressApp, addJsonErrorHandler, addJsonNotFoundHandler } from '../../shared/expressApp.js';

export function createCatalogServer({ useCases, port = 3101 }) {
  const app = createExpressApp();
  const requireInternalToken = (req, res, next) => {
    const internalToken = process.env.CATALOG_INTERNAL_TOKEN;
    if (!internalToken || req.headers['x-internal-token'] !== internalToken) {
      return res.status(404).json({ error: 'Ruta de catálogo no encontrada.' });
    }
    next();
  };

  app.get('/health', (req, res) => res.json({ service: 'catalog', status: 'ok' }));
  app.get('/products', async (req, res) => {
    res.json({ products: await useCases.listProducts(req.query) });
  });
  app.get('/admin/products', requireInternalToken, async (req, res) => {
    res.json({ products: await useCases.listAllProducts() });
  });
  app.post('/admin/products', requireInternalToken, async (req, res) => {
    res.status(201).json({ product: await useCases.saveProduct(req.body || {}) });
  });
  app.put('/admin/products/:id', requireInternalToken, async (req, res, next) => {
    if (!/^[a-z0-9-]+$/.test(req.params.id)) return next();
    res.json({ product: await useCases.saveProduct({ ...(req.body || {}), id: req.params.id }) });
  });
  app.patch('/admin/products/:id', requireInternalToken, async (req, res, next) => {
    if (!/^[a-z0-9-]+$/.test(req.params.id)) return next();
    const { active } = req.body || {};
    if (typeof active !== 'boolean') return res.status(400).json({ error: 'Indica si el producto debe estar activo.' });
    res.json(await useCases.setProductActive(req.params.id, active));
  });
  app.get('/products/:id', async (req, res, next) => {
    if (!/^[\w-]+$/.test(req.params.id)) return next();
    const product = await useCases.getProduct(req.params.id);
    return product ? res.json(product) : res.status(404).json({ error: 'Producto no encontrado.' });
  });
  app.post('/reserve', requireInternalToken, async (req, res) => {
    const { items = [] } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Los artículos deben enviarse en una lista.' });
    res.json(await useCases.reserveStock(items));
  });
  app.post('/release', requireInternalToken, async (req, res) => {
    const { items = [] } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Los artículos deben enviarse en una lista.' });
    res.json(await useCases.releaseStock(items));
  });

  addJsonNotFoundHandler(app, 'Ruta de catálogo no encontrada.');
  addJsonErrorHandler(app, 'No se pudo procesar la solicitud.');
  return app.listen(port, () => console.log(`Catálogo escuchando en http://localhost:${port}`));
}