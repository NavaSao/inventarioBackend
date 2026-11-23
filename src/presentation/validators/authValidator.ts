import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

export const loginSchema = z.object({
  correo: z.string().trim().toLowerCase().pipe(z.email('El formato del correo es inválido')),
  password: z
    .string()
    .min(1, 'La contraseña no puede estar vacía')
    .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'La contraseña no puede exceder 72 bytes'),
});

export type LoginBody = z.infer<typeof loginSchema>;

export function validateLogin(req: Request, _res: Response, next: NextFunction): void {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
    throw new ValidationError('Datos de inicio de sesión inválidos', issues);
  }
  req.body = result.data;
  next();
}
