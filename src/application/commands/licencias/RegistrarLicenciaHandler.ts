import type { ILicenciaRepository } from '../../../domain/contracts/licencias.js';
import { diaDeConsulta, resumirLicencia, type DatosLicencia } from '../../../domain/models/Licencia.js';

export type RegistrarLicenciaCommand = DatosLicencia & { plan: string; periodicidad: string };

export interface IRegistrarLicenciaHandler {
  handle(command: RegistrarLicenciaCommand): Promise<ReturnType<typeof resumirLicencia>>;
}

export class RegistrarLicenciaHandler implements IRegistrarLicenciaHandler {
  constructor(private readonly repositorio: ILicenciaRepository) {}

  async handle(command: RegistrarLicenciaCommand) {
    const licencia = await this.repositorio.registrar(command);
    return resumirLicencia(licencia, 0, diaDeConsulta());
  }
}
