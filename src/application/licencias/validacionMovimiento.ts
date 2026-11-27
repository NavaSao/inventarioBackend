import { z } from 'zod';

export const licenciaMovimientoParamSchema = z.object({
  idLicencia: z.string().uuid({ message: 'El idLicencia debe ser un UUID válido' }),
});
