import { z } from 'zod';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

export const texto = z.string().trim().min(1, 'El campo no puede estar vacío').max(120, 'Máximo 120 caracteres');
export const correoSchema = z.string().trim().toLowerCase().pipe(z.email('El formato del correo es inválido'));

export const parametrosEmpleadoSchema = z.object({
  id: z.uuid('El identificador debe ser un UUID válido'),
});

export function validarEmpleado<T>(schema: z.ZodType<T>, datos: unknown): T {
  const resultado = schema.safeParse(datos);
  if (!resultado.success) {
    const errores = resultado.error.issues.map((issue) => ({
      campo: issue.path.join('.') || 'solicitud',
      mensaje: issue.message,
    }));
    throw new ValidationError('Datos de empleado inválidos', errores);
  }
  return resultado.data;
}
