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
