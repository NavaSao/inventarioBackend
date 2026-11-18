import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ValidationError) {
    ResponseBuilder.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  if (err instanceof BusinessError) {
    ResponseBuilder.error(res, err.message, err.statusCode);
    return;
  }

  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 400 || status === 413 || status === 415) {
      ResponseBuilder.error(res, 'Solicitud con formato incorrecto o carga excesiva', status);
      return;
    }
  }

  console.error('Error no controlado:', err instanceof Error ? err.stack : err);
  ResponseBuilder.error(res, 'Error interno del servidor', 500);
};
