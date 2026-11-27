import { z } from 'zod';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

export function validarLicencia<T>(schema: z.ZodType<T>, datos: unknown): T {
  const resultado = schema.safeParse(datos);
  if (!resultado.success) {
    const errores = resultado.error.issues.map((issue) => ({
      campo: issue.path.join('.') || 'solicitud',
      mensaje: issue.message,
    }));
    throw new ValidationError('Datos de licencia inválidos', errores);
  }
  return resultado.data;
}
