import { z } from 'zod';
import { texto, correoSchema } from '../../validacionEmpleado.js';

export const registroEmpleadoSchema = z.object({
  nombre: texto,
  correo: correoSchema,
  numeroEmpleado: z.string().trim().min(1, 'El número de empleado es requerido').max(50, 'Máximo 50 caracteres'),
  departamento: z.string().trim().min(1, 'El departamento es requerido').max(100, 'Máximo 100 caracteres'),
  cargo: z.string().trim().min(1, 'El cargo es requerido').max(100, 'Máximo 100 caracteres'),
  enviarCorreoBienvenida: z.boolean().optional(),
});
