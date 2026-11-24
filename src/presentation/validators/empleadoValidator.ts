import { z } from 'zod';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

const texto = z.string().trim().min(1, 'El campo no puede estar vacío').max(120, 'Máximo 120 caracteres');
const correoSchema = z.string().trim().toLowerCase().pipe(z.email('El formato del correo es inválido'));

export const registroEmpleadoSchema = z.object({
  nombre: texto,
  correo: correoSchema,
  numeroEmpleado: z.string().trim().min(1, 'El número de empleado es requerido').max(50, 'Máximo 50 caracteres'),
  departamento: z.string().trim().min(1, 'El departamento es requerido').max(100, 'Máximo 100 caracteres'),
  cargo: z.string().trim().min(1, 'El cargo es requerido').max(100, 'Máximo 100 caracteres'),
  enviarCorreoBienvenida: z.boolean().optional(),
});

export const editarEmpleadoSchema = z.object({
  nombre: texto,
  correo: correoSchema,
  numeroEmpleado: z.string().trim().min(1, 'El número de empleado es requerido').max(50, 'Máximo 50 caracteres'),
  departamento: z.string().trim().min(1, 'El departamento es requerido').max(100, 'Máximo 100 caracteres'),
  cargo: z.string().trim().min(1, 'El cargo es requerido').max(100, 'Máximo 100 caracteres'),
});

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
