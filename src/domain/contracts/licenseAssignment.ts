import type { EstadoLicencia, Licencia } from '../models/Licencia.js';
import type { Empleado } from '../models/Empleado.js';

export interface AsignacionLicenciaDetalle {
  idAsignacionLicencia: string;
  idLicencia: string;
  idEmpleado: string;
  idUsuarioAsignacion: string;
  asignadoEn: Date;
  idUsuarioLiberacion: string | null;
  liberadoEn: Date | null;
  nota: string | null;
  claveAsignacion: string;
  claveLiberacion: string | null;
}

export interface AssignLicenseInput {
  idLicencia: string;
  idEmpleado: string;
  idUsuarioAsignacion: string;
  claveAsignacion?: string;
  nota?: string | null;
}

export interface ReleaseLicenseInput {
  idAsignacionLicencia?: string;
  idLicencia?: string;
  idEmpleado?: string;
  idUsuarioLiberacion: string;
  claveLiberacion?: string;
  fechaLiberacion?: Date | string;
  nota?: string | null;
}

export interface AssignmentResult {
  asignacion: AsignacionLicenciaDetalle;
  licencia: Licencia;
  empleado: Empleado;
  cuposAsignados: number;
  cuposLibresResultantes: number;
  cuposLibresActualizados: number;
  cuposAsignables: number;
  porcentajeOcupacion: number;
  estadoLicencia: EstadoLicencia;
  reintentoRecuperado: boolean;
  correoNotificado: boolean;
  correoStatus: 'SENT' | 'SKIPPED' | 'FAILED';
  correoReason?: string;
}

export interface AssignmentPreviewResult {
  licencia: ReturnType<typeof import('../models/Licencia.js').resumirLicencia>;
  empleado: {
    idEmpleado: string;
    numeroEmpleado: string;
    nombre: string;
    correo: string;
    departamento: string | null;
    cargo: string | null;
    activo: boolean;
  };
  puedeAsignar: boolean;
  motivoRechazo: string | null;
  cuposLibresActuales: number;
  cuposLibresResultantes: number;
  porcentajeOcupacionActual: number;
  porcentajeOcupacionResultante: number;
}

export interface ReleaseResult {
  asignacion: AsignacionLicenciaDetalle;
  licencia: Licencia;
  empleado: Empleado;
  cuposAsignados: number;
  cuposLibresActualizados: number;
  cuposAsignables: number;
  porcentajeOcupacion: number;
  estadoLicencia: EstadoLicencia;
  reintentoRecuperado: boolean;
}

export type { ILicenseAssignmentRepository } from './ILicenseAssignmentRepository.js';

export type { ILicenseUnitOfWork } from './ILicenseUnitOfWork.js';

export type { IAssignmentNotificationDispatcher } from './IAssignmentNotificationDispatcher.js';
