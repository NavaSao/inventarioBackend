import type { DatosLicencia } from '../../../../domain/models/Licencia.js';

export type RegistrarLicenciaCommand = DatosLicencia & { plan: string; periodicidad: string };
