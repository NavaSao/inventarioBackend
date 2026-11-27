import { z } from 'zod';

export const filtrosLicenciaSchema = z.object({
  busqueda: z.string().trim().max(120).optional(),
  estado: z.string().trim().toUpperCase().pipe(z.enum(['TODAS', 'VIGENTE', 'POR_VENCER', 'VENCIDA'])).optional(),
});
