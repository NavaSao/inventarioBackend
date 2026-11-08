import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import { rutasAuth } from './auth/login.routes.js';

const app = express();
const host = process.env.HOST || '127.0.0.1';
const puerto = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '4kb' }));
app.use('/api/auth', rutasAuth);

const manejarError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const estado = typeof error === 'object' && error !== null && 'status' in error
    ? error.status
    : undefined;

  if (estado === 400 || estado === 413 || estado === 415) {
    res.status(estado).json({ mensaje: 'Revisa los datos de la solicitud' });
    return;
  }

  console.error('Error en la API:', error instanceof Error ? error.name : 'desconocido');
  res.status(500).json({ mensaje: 'No se pudo procesar la solicitud' });
};
app.use(manejarError);

app.listen(puerto, host, () => console.log(`API disponible en http://${host}:${puerto}`));
