import { z } from 'zod';

export const assignLicenseBodySchema = z.object({
  idEmpleado: z.string().uuid({ message: 'El idEmpleado debe ser un UUID válido' }),
  claveAsignacion: z
    .string()
    .trim()
    .uuid({ message: 'La claveAsignacion debe ser un UUID válido' })
    .optional(),
  nota: z.string().trim().max(500, 'La nota no puede exceder 500 caracteres').optional().nullable(),
});
