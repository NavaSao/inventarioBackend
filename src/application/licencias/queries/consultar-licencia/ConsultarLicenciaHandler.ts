import type { ILicenciaReadModel } from '../../../../domain/contracts/licencias.js';
import { BusinessError } from '../../../../domain/exceptions/BusinessError.js';
import { diaDeConsulta, resumirLicencia } from '../../../../domain/models/Licencia.js';

export class ConsultarLicenciaHandler {
  constructor(private readonly lectura: ILicenciaReadModel) {}

  async handle(idLicencia: string) {
    const licencia = await this.lectura.consultar(idLicencia);
    if (!licencia) {
      throw new BusinessError('Licencia no encontrada', 404);
    }

    const { empleadosAsignados, historialAsignaciones, ...contrato } = licencia;
    return {
      ...resumirLicencia(contrato, empleadosAsignados.length, diaDeConsulta()),
      empleadosAsignados,
      ...(historialAsignaciones !== undefined ? { historialAsignaciones } : {}),
    };
  }
}
