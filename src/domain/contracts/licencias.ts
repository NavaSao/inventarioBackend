import type {
  CupoAsignado,
  DatosLicencia,
  EstadoLicencia,
  Licencia,
  MovimientoLicenciaHistorial,
} from '../models/Licencia.js';

export interface FiltroLicencias {
  busqueda?: string;
  estado?: EstadoLicencia | 'TODAS';
}

export interface ILicenciaRepository {
  registrar(datos: DatosLicencia): Promise<Licencia>;
}

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

export interface ILicenseHistoryReadModel {
  consultarHistorial(
    idLicencia: string,
  ): Promise<
    | {
        licencia: Licencia;
        cuposAsignados: number;
        historial: MovimientoLicenciaHistorial[];
      }
    | null
  >;
}
