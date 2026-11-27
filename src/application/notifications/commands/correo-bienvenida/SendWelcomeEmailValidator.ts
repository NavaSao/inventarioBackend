import { z } from 'zod';
import { emailSchema, optionalNonEmptyString } from '../../validacionCorreo.js';

export const welcomeEmailSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  correo: emailSchema,
  tipoDestinatario: z.enum(['EMPLEADO', 'USUARIO']).default('EMPLEADO'),
  enviarCorreo: z.boolean().optional(),
  numeroEmpleado: optionalNonEmptyString,
  departamento: optionalNonEmptyString,
});
