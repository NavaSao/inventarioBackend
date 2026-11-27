import { z } from 'zod';

export const parametrosLicenciaSchema = z.object({ idLicencia: z.uuid() });
