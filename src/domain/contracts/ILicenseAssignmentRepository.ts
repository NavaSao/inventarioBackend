import type { AsignacionLicenciaDetalle, AssignLicenseInput } from './licenseAssignment.js';
import type { Empleado } from '../models/Empleado.js';
import type { Licencia } from '../models/Licencia.js';

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
