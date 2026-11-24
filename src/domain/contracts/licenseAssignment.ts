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

  buscarAsignacionPorClave?(
    claveAsignacion: string,
  ): Promise<AsignacionLicenciaDetalle | null>;

  buscarAsignacionPorClaveLiberacion?(
    claveLiberacion: string,
  ): Promise<AsignacionLicenciaDetalle | null>;

  obtenerNombreUsuario?(idUsuario: string): Promise<string | null>;

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
