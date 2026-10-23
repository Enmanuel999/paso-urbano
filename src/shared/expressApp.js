import express from 'express';

export function createExpressApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type,authorization,x-internal-token');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  return app;
}

export function addJsonNotFoundHandler(app, message) {
  app.use((req, res) => res.status(404).json({ error: message }));
}

export function addJsonErrorHandler(app, fallbackMessage) {
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.statusCode || error.status || 400;
    const message = error.type === 'entity.parse.failed'
      ? 'El cuerpo de la solicitud no es JSON válido.'
      : error.message || fallbackMessage;
    res.status(status).json({ error: message });
  });
}