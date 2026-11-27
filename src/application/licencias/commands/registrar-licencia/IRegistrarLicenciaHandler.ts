import type { RegistrarLicenciaCommand } from './RegistrarLicenciaCommand.js';
import type { resumirLicencia } from '../../../../domain/models/Licencia.js';

export interface IRegistrarLicenciaHandler {
  handle(command: RegistrarLicenciaCommand): Promise<ReturnType<typeof resumirLicencia>>;
}
