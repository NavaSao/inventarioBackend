import express, { type Router } from 'express';
import { BusinessError } from './exceptions/BusinessError.js';
import { manejarError } from './middlewares/errorHandler.js';
import { responder } from './utils/responseBuilder.js';

export function crearApp(rutasAuth: Router) {
  const app = express();

  app.use(express.json({ limit: '4kb' }));
  app.get('/health', (_req, res) => {
    responder(res, 200, 'API disponible');
  });
  app.use('/api/auth', rutasAuth);
  app.use((_req, _res, next) => {
    next(new BusinessError(404, 'Ruta no encontrada'));
  });
  app.use(manejarError);

  return app;
}
