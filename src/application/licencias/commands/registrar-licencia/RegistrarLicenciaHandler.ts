import type { ILicenciaRepository } from '../../../../domain/contracts/licencias.js';
import { diaDeConsulta, resumirLicencia } from '../../../../domain/models/Licencia.js';
import type { RegistrarLicenciaCommand } from './RegistrarLicenciaCommand.js';
import type { IRegistrarLicenciaHandler } from './IRegistrarLicenciaHandler.js';

export class RegistrarLicenciaHandler implements IRegistrarLicenciaHandler {
  constructor(private readonly repositorio: ILicenciaRepository) {}

  async handle(command: RegistrarLicenciaCommand) {
    const licencia = await this.repositorio.registrar(command);
    return resumirLicencia(licencia, 0, diaDeConsulta());
  }
}
