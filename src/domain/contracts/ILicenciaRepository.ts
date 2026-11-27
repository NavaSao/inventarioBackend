import type { DatosLicencia, Licencia } from '../models/Licencia.js';

export interface ILicenciaRepository {
  registrar(datos: DatosLicencia): Promise<Licencia>;
}
