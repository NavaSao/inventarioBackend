import { randomUUID } from 'node:crypto';
import type {
  ILicenseUnitOfWork,
  ReleaseResult,
} from '../../../domain/contracts/licenseAssignment.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import type { ReleaseLicenseCommand } from './ReleaseLicenseCommand.js';

/**
 * Orquestador de Caso de Uso HU07: Liberación de Licencias (incluyendo licencias vencidas).
 * Principios aplicados:
 * - DIP: Depende exclusivamente de ILicenseUnitOfWork.
 * - Atomicidad: Actualiza la asignación abierta, clave de liberación y recalcula cupos.
 */
export class ReleaseLicenseCommandHandler {
  constructor(private readonly unitOfWork: ILicenseUnitOfWork) {}

  async handle(command: ReleaseLicenseCommand): Promise<ReleaseResult> {
    const { idAsignacionLicencia, idLicencia, idEmpleado, idUsuarioLiberacion, nota } =
      command.payload;
    const ahora = new Date();
    const claveLiberacion = randomUUID();

    return this.unitOfWork.executeInTransaction(async (repo) => {
      let asignacion;

      if (idAsignacionLicencia) {
        asignacion = await repo.buscarAsignacionPorId(idAsignacionLicencia);
      } else if (idLicencia && idEmpleado) {
        asignacion = await repo.buscarAsignacionAbierta(idLicencia, idEmpleado);
      }

      if (!asignacion) {
        throw new BusinessError('Asignación de licencia no encontrada', 404);
      }

      if (asignacion.liberadoEn !== null) {
        throw new BusinessError('La asignación ya ha sido liberada previamente', 400);
      }

      const asignacionLiberada = await repo.liberarCupo(
        asignacion.idAsignacionLicencia,
        idUsuarioLiberacion,
        claveLiberacion,
        ahora,
        nota,
      );

      const licencia = await repo.obtenerLicencia(asignacion.idLicencia);
      if (!licencia) {
        throw new BusinessError('Licencia asociada no encontrada', 404);
      }

      const empleado = await repo.obtenerEmpleado(asignacion.idEmpleado);
      if (!empleado) {
        throw new BusinessError('Empleado asociado no encontrado', 404);
      }

      const cuposOcupados = await repo.contarCuposOcupados(licencia.idLicencia);
      const cuposLibresActualizados = Math.max(licencia.cuposContratados - cuposOcupados, 0);

      return {
        asignacion: asignacionLiberada,
        licencia,
        empleado,
        cuposLibresActualizados,
      };
    });
  }
}
