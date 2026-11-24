import type { Licencia } from '../models/Licencia.js';
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
  nota?: string | null;
}

export interface ReleaseLicenseInput {
  idAsignacionLicencia?: string;
  idLicencia?: string;
  idEmpleado?: string;
  idUsuarioLiberacion: string;
  nota?: string | null;
}

export interface AssignmentResult {
  asignacion: AsignacionLicenciaDetalle;
  licencia: Licencia;
  empleado: Empleado;
  correoNotificado: boolean;
  correoStatus: 'SENT' | 'SKIPPED' | 'FAILED';
  correoReason?: string;
}

export interface ReleaseResult {
  asignacion: AsignacionLicenciaDetalle;
  licencia: Licencia;
  empleado: Empleado;
  cuposLibresActualizados: number;
}

/**
 * Repositorio segregado de escritura y lectura transaccional para asignaciones de licencias (ISP).
 */
export interface ILicenseAssignmentRepository {
  asignarCupo(
    input: AssignLicenseInput,
    claveAsignacion: string,
    fechaAsignacion: Date,
  ): Promise<AsignacionLicenciaDetalle>;

  liberarCupo(
    idAsignacionLicencia: string,
    idUsuarioLiberacion: string,
    claveLiberacion: string,
    fechaLiberacion: Date,
    nota?: string | null,
  ): Promise<AsignacionLicenciaDetalle>;

  buscarAsignacionAbierta(
    idLicencia: string,
    idEmpleado: string,
  ): Promise<AsignacionLicenciaDetalle | null>;

  buscarAsignacionPorId(
    idAsignacionLicencia: string,
  ): Promise<AsignacionLicenciaDetalle | null>;

  contarCuposOcupados(idLicencia: string): Promise<number>;
  obtenerLicencia(idLicencia: string): Promise<Licencia | null>;
  obtenerEmpleado(idEmpleado: string): Promise<Empleado | null>;
}

/**
 * Abstracción de Unidad de Trabajo / Transacciones Atómicas (DIP y ACID).
 */
export interface ILicenseUnitOfWork {
  executeInTransaction<T>(
    operation: (repo: ILicenseAssignmentRepository) => Promise<T>,
  ): Promise<T>;
}

/**
 * Despachador de notificaciones resiliente con reintentos para asignaciones (HU06).
 */
export interface IAssignmentNotificationDispatcher {
  dispatchAssignmentEmail(
    licencia: Licencia,
    empleado: Empleado,
    fechaAsignacion: Date,
    nombreUsuarioAsignacion?: string,
    nota?: string | null,
  ): Promise<{ status: 'SENT' | 'SKIPPED' | 'FAILED'; sent: boolean; reason?: string }>;
}
