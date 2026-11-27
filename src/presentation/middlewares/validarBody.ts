import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

export function validarBody<T>(schema: ZodType<T>, mensaje: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      const errores = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      }));
      throw new ValidationError(mensaje, errores);
    }
    req.body = resultado.data;
    next();
  };
}
