import { z } from 'zod';

export const previewAssignLicenseQuerySchema = z.object({
  idEmpleado: z.string().uuid({ message: 'El idEmpleado debe ser un UUID válido' }),
});
