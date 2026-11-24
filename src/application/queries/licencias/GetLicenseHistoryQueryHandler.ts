import type { ILicenseHistoryReadModel } from '../../../domain/contracts/licencias.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import { diaDeConsulta, resumirLicencia } from '../../../domain/models/Licencia.js';
import type { GetLicenseHistoryQuery } from './GetLicenseHistoryQuery.js';

/**
 * Consulta el historial completo (asignaciones abiertas y liberadas) de una licencia (HU07).
 */
export class GetLicenseHistoryQueryHandler {
  constructor(private readonly readModel: ILicenseHistoryReadModel) {}

  async handle(query: GetLicenseHistoryQuery) {
    const resultado = await this.readModel.consultarHistorial(query.idLicencia);
    if (!resultado) {
      throw new BusinessError('Licencia no encontrada', 404);
    }

    const hoy = diaDeConsulta();
    return {
      ...resumirLicencia(resultado.licencia, resultado.cuposAsignados, hoy),
      historial: resultado.historial,
    };
  }
}

