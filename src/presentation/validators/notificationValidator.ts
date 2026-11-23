import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('El formato del correo electrónico es inválido'));

const optionalNonEmptyString = z.string().trim().min(1).optional();

export const welcomeEmailSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  correo: emailSchema,
  tipoDestinatario: z.enum(['EMPLEADO', 'USUARIO']).default('EMPLEADO'),
  enviarCorreo: z.boolean().optional(),
  numeroEmpleado: optionalNonEmptyString,
  departamento: optionalNonEmptyString,
});

const assignmentBaseFields = {
  nombreEmpleado: z.string().trim().min(2, 'El nombre del empleado es obligatorio'),
  correoEmpleado: emailSchema,
  numeroEmpleado: optionalNonEmptyString,
  departamento: optionalNonEmptyString,
  fechaAsignacion: z.iso.datetime('La fecha de asignación debe estar en formato ISO 8601').optional(),
  asignadoPor: optionalNonEmptyString,
  nota: optionalNonEmptyString,
};

const assetAssignmentSchema = z.object({
  ...assignmentBaseFields,
  tipo: z.literal('ACTIVO'),
  detalle: z.object({
    nombreActivo: z.string().trim().min(1, 'El nombre del activo es obligatorio'),
    etiqueta: z.string().trim().min(1, 'La etiqueta del activo es obligatoria'),
    numeroSerie: z.string().trim().min(1, 'El número de serie es obligatorio'),
    categoria: z.string().trim().min(1, 'La categoría del activo es obligatoria'),
    ubicacion: z.string().trim().min(1, 'La ubicación del activo es obligatoria'),
    marca: optionalNonEmptyString,
    modelo: optionalNonEmptyString,
  }),
});

const licenseAssignmentSchema = z.object({
  ...assignmentBaseFields,
  tipo: z.literal('LICENCIA'),
  detalle: z.object({
    software: z.string().trim().min(1, 'El nombre del software es obligatorio'),
    proveedor: optionalNonEmptyString,
    referenciaContrato: optionalNonEmptyString,
    inicioVigencia: optionalNonEmptyString,
    finVigencia: optionalNonEmptyString,
  }),
});

export const assignmentNoticeSchema = z.discriminatedUnion('tipo', [
  assetAssignmentSchema,
  licenseAssignmentSchema,
]);

export const testEmailSchema = z.object({
  correoDestino: emailSchema,
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').default('Cuenta de Prueba'),
  tipoPrueba: z.enum(['BIENVENIDA', 'ASIGNACION_ACTIVO', 'ASIGNACION_LICENCIA']).default('BIENVENIDA'),
});

function createValidator<T extends z.ZodTypeAny>(schema: T, errorMessage: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      }));
      throw new ValidationError(errorMessage, issues);
    }
    req.body = result.data;
    next();
  };
}

export const validateWelcomeEmail = createValidator(
  welcomeEmailSchema,
  'Datos inválidos para el correo de bienvenida (HU03)',
);

export const validateAssignmentNotice = createValidator(
  assignmentNoticeSchema,
  'Datos inválidos para el aviso de asignación (HU06)',
);

export const validateTestEmail = createValidator(
  testEmailSchema,
  'Datos inválidos para el envío de correo de prueba',
);
