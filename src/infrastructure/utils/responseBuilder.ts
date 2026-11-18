import type { Response } from 'express';

export class ResponseBuilder {
  static success<T>(res: Response, data: T, message = 'Operación exitosa', statusCode = 200): Response {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  }

  static error(res: Response, message = 'Error en la solicitud', statusCode = 400, errors?: unknown): Response {
    return res.status(statusCode).json({
      status: 'error',
      message,
      ...(errors ? { errors } : {}),
    });
  }
}
