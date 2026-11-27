import type { FiltroLicencias } from './licencias.js';
import type { CupoAsignado, Licencia, MovimientoLicenciaHistorial } from '../models/Licencia.js';

export interface ILicenciaReadModel {
  listar(filtros: FiltroLicencias, hoy: Date): Promise<Array<Licencia & { cuposAsignados: number }>>;
  consultar(
    idLicencia: string,
  ): Promise<
    | (Licencia & {
        empleadosAsignados: CupoAsignado[];
        historialAsignaciones?: MovimientoLicenciaHistorial[];
      })
    | null
  >;
}
