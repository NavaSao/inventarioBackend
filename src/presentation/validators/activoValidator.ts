import { z } from 'zod';
import { EstadoActivo } from '../../domain/enums/EstadoActivo.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

const texto = z.string().trim().min(1, 'El campo es obligatorio').max(120, 'Máximo 120 caracteres');
const textoOpcional = z.string().trim().max(120).nullish().transform((valor) => valor || null);
const nota = z.string().trim().max(500, 'Máximo 500 caracteres').nullish().transform((valor) => valor || null);
const etiqueta = z.string().trim().toLowerCase().pipe(z.uuid('La etiqueta debe ser un UUID válido'));

export const datosActivoSchema = z.object({
  nombre: texto,
  numeroSerie: texto.toUpperCase(),
  etiqueta,
  categoria: texto,
  ubicacion: texto,
  marca: textoOpcional,
  modelo: textoOpcional,
});

export const filtrosActivoSchema = z.object({
  busqueda: z.string().trim().max(120).optional(),
  estado: z.enum(EstadoActivo).optional(),
});

export const parametrosActivoSchema = z.object({ idActivo: z.uuid() });
export const parametrosEtiquetaSchema = z.object({ etiqueta });

export const asignarActivoSchema = z.object({ idEmpleado: z.uuid('Selecciona un empleado'), nota });
export const notaOpcionalSchema = z.object({ nota });
export const notaMantenimientoSchema = z.object({
  nota: z.string({ error: 'La nota de mantenimiento es obligatoria' }).trim()
    .min(1, 'La nota de mantenimiento es obligatoria').max(500, 'Máximo 500 caracteres'),
});

/** La app envía la foto JPEG en base64 como text/plain. */
export const fotoSchema = z.string().trim()
  .transform((base64) => Buffer.from(base64, 'base64'))
  .refine((foto) => foto.length > 0 && foto[0] === 0xff && foto[1] === 0xd8, 'La foto debe ser una imagen JPEG');

export function validarActivo<T>(schema: z.ZodType<T>, datos: unknown): T {
  const resultado = schema.safeParse(datos ?? {});
  if (!resultado.success) {
    const errores = resultado.error.issues.map((issue) => ({
      campo: issue.path.join('.') || 'solicitud',
      mensaje: issue.message,
    }));
    throw new ValidationError(resultado.error.issues[0]?.message ?? 'Datos de activo inválidos', errores);
  }
  return resultado.data;
}
