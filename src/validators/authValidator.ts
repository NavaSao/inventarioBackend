import type { RequestHandler } from 'express';
import { z } from 'zod';
import { ValidationError } from '../exceptions/ValidationError.js';

export const credencialesSchema = z.object({
  correo: z.string().trim().toLowerCase().pipe(z.email()),
  // Bcrypt limita la contraseña a 72 bytes, que no siempre son 72 caracteres.
  password: z.string().min(1).refine((valor) => Buffer.byteLength(valor, 'utf8') <= 72),
});

export type Credenciales = z.infer<typeof credencialesSchema>;

export const validarLogin: RequestHandler = (req, _res, next) => {
  const entrada = credencialesSchema.safeParse(req.body);
  if (!entrada.success) {
    next(new ValidationError('Revisa el correo y la contraseña'));
    return;
  }

  req.body = entrada.data;
  next();
};
