import { z } from 'zod';

export const assignLicenseParamSchema = z.object({
  idLicencia: z.string().uuid({ message: 'El idLicencia debe ser un UUID válido' }),
});

export const assignLicenseBodySchema = z.object({
  idEmpleado: z.string().uuid({ message: 'El idEmpleado debe ser un UUID válido' }),
  nota: z.string().trim().max(500, 'La nota no puede exceder 500 caracteres').optional().nullable(),
});

export const releaseLicenseParamSchema = z.object({
  idAsignacionLicencia: z.string().uuid({ message: 'El idAsignacionLicencia debe ser un UUID válido' }).optional(),
  idLicencia: z.string().uuid({ message: 'El idLicencia debe ser un UUID válido' }).optional(),
});

export const releaseLicenseBodySchema = z.object({
  idEmpleado: z.string().uuid({ message: 'El idEmpleado debe ser un UUID válido' }).optional(),
  nota: z.string().trim().max(500, 'La nota no puede exceder 500 caracteres').optional().nullable(),
});
