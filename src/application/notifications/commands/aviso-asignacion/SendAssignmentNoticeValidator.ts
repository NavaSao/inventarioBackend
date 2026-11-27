import { z } from 'zod';
import { emailSchema, optionalNonEmptyString } from '../../validacionCorreo.js';

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
