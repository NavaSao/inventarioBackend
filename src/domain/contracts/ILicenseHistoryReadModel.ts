import type { Licencia, MovimientoLicenciaHistorial } from '../models/Licencia.js';

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
