import type { EstadoLicencia } from '../models/Licencia.js';

export interface FiltroLicencias {
  busqueda?: string;
  estado?: EstadoLicencia | 'TODAS';
}

export type { ILicenciaRepository } from './ILicenciaRepository.js';

export type { ILicenciaReadModel } from './ILicenciaReadModel.js';

export type { ILicenseHistoryReadModel } from './ILicenseHistoryReadModel.js';
