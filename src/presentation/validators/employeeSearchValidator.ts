import { z } from 'zod';

export const employeeFilterSchema = z.object({
  busqueda: z.string().trim().optional(),
  departamento: z.string().trim().optional(),
  area: z.string().trim().optional(),
  activo: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true' || val === '1';
    }),
});

export const employeeSelectorSchema = z.object({
  busqueda: z.string().trim().optional(),
  q: z.string().trim().optional(),
  soloActivos: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((val) => {
      if (val === undefined) return true;
      return val === 'true' || val === '1';
    }),
  limite: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().positive().max(100)),
});
