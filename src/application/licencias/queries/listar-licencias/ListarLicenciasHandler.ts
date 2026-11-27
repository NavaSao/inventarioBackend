import type { FiltroLicencias, ILicenciaReadModel } from '../../../../domain/contracts/licencias.js';
import { diaDeConsulta, resumirLicencia } from '../../../../domain/models/Licencia.js';

export class ListarLicenciasHandler {
  constructor(private readonly lectura: ILicenciaReadModel) {}

  async handle(filtros: FiltroLicencias) {
    const hoy = diaDeConsulta();
    const licencias = await this.lectura.listar(filtros, hoy);
    return licencias.map(({ cuposAsignados, ...licencia }) => resumirLicencia(licencia, cuposAsignados, hoy));
  }
}
