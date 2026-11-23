import type { FiltroLicencias, ILicenciaReadModel } from '../../../domain/contracts/licencias.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import { diaDeConsulta, resumirLicencia } from '../../../domain/models/Licencia.js';

export class ListarLicenciasHandler {
  constructor(private readonly lectura: ILicenciaReadModel) {}

  async handle(filtros: FiltroLicencias) {
    const hoy = diaDeConsulta();
    const licencias = await this.lectura.listar(filtros, hoy);
    return licencias.map(({ cuposAsignados, ...licencia }) => resumirLicencia(licencia, cuposAsignados, hoy));
  }
}

export class ConsultarLicenciaHandler {
  constructor(private readonly lectura: ILicenciaReadModel) {}

  async handle(idLicencia: string) {
    const licencia = await this.lectura.consultar(idLicencia);
    if (!licencia) {
      throw new BusinessError('Licencia no encontrada', 404);
    }

    const { empleadosAsignados, ...contrato } = licencia;
    return { ...resumirLicencia(contrato, empleadosAsignados.length, diaDeConsulta()), empleadosAsignados };
  }
}
