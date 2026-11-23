import type { CupoAsignado, DatosLicencia, EstadoLicencia, Licencia } from '../models/Licencia.js';

export interface FiltroLicencias {
  busqueda?: string;
  estado?: EstadoLicencia | 'TODAS';
}

export interface ILicenciaRepository {
  registrar(datos: DatosLicencia): Promise<Licencia>;
}

export interface ILicenciaReadModel {
  listar(filtros: FiltroLicencias, hoy: Date): Promise<Array<Licencia & { cuposAsignados: number }>>;
  consultar(idLicencia: string): Promise<(Licencia & { empleadosAsignados: CupoAsignado[] }) | null>;
}
