import { z } from 'zod';
import { emailSchema } from '../../validacionCorreo.js';

export const testEmailSchema = z.object({
  correoDestino: emailSchema,
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').default('Cuenta de Prueba'),
  tipoPrueba: z.enum(['BIENVENIDA', 'ASIGNACION_ACTIVO', 'ASIGNACION_LICENCIA']).default('BIENVENIDA'),
});
