import type { ErrorRequestHandler } from 'express';
import { BusinessError } from '../exceptions/BusinessError.js';
import { ValidationError } from '../exceptions/ValidationError.js';
import { responder } from '../utils/responseBuilder.js';

export const manejarError: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof BusinessError) {
    responder(res, error.status, error.message);
    return;
  }
  if (error instanceof ValidationError) {
    responder(res, 400, error.message);
    return;
  }

  const status = typeof error === 'object' && error !== null && 'status' in error
    ? error.status
    : undefined;
  if (status === 400 || status === 413 || status === 415) {
    responder(res, status, 'Revisa los datos de la solicitud');
    return;
  }

  console.error('Error en la API:', error instanceof Error ? error.name : 'desconocido');
  responder(res, 500, 'No se pudo procesar la solicitud');
};
