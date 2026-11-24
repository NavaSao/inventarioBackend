import { z } from 'zod';

const optionalUuidHeader = z
  .string()
  .trim()
  .uuid({ message: 'La clave de idempotencia (Idempotency-Key) debe ser un UUID válido' })
  .optional();

export const assignLicenseParamSchema = z.object({
  idLicencia: z.string().uuid({ message: 'El idLicencia debe ser un UUID válido' }),
});

export const assignLicenseBodySchema = z.object({
  idEmpleado: z.string().uuid({ message: 'El idEmpleado debe ser un UUID válido' }),
  claveAsignacion: z
    .string()
    .trim()
    .uuid({ message: 'La claveAsignacion debe ser un UUID válido' })
    .optional(),
  nota: z.string().trim().max(500, 'La nota no puede exceder 500 caracteres').optional().nullable(),
});

export const previewAssignLicenseQuerySchema = z.object({
  idEmpleado: z.string().uuid({ message: 'El idEmpleado debe ser un UUID válido' }),
});

export const releaseLicenseParamSchema = z.object({
  idAsignacionLicencia: z
    .string()
    .uuid({ message: 'El idAsignacionLicencia debe ser un UUID válido' })
    .optional(),
  idLicencia: z.string().uuid({ message: 'El idLicencia debe ser un UUID válido' }).optional(),
});

export const releaseLicenseBodySchema = z.object({
  idEmpleado: z.string().uuid({ message: 'El idEmpleado debe ser un UUID válido' }).optional(),
  claveLiberacion: z
    .string()
    .trim()
    .uuid({ message: 'La claveLiberacion debe ser un UUID válido' })
    .optional(),
  fechaLiberacion: z
    .string()
    .trim()
    .min(1, 'La fechaLiberacion no puede estar vacía')
    .refine(
      (val) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const parsed = new Date(`${val}T00:00:00.000Z`);
          return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === val;
        }
        return !Number.isNaN(Date.parse(val));
      },
      { message: 'La fechaLiberacion debe tener formato ISO válido (AAAA-MM-DD o fecha-hora ISO)' },
    )
    .optional(),
  nota: z.string().trim().max(500, 'La nota no puede exceder 500 caracteres').optional().nullable(),
});

export function extractIdempotencyKey(headers?: Record<string, unknown>): string | undefined {
  const raw = headers?.['idempotency-key'];
  if (raw === undefined) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return optionalUuidHeader.parse(value);
}
