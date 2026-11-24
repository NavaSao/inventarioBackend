import { randomUUID } from 'node:crypto';
import type {
  AssignmentResult,
  IAssignmentNotificationDispatcher,
  ILicenseUnitOfWork,
} from '../../../domain/contracts/licenseAssignment.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import { diaDeConsulta } from '../../../domain/models/Licencia.js';
import type { AssignLicenseCommand } from './AssignLicenseCommand.js';

/**
 * Orquestador de Caso de Uso HU06: Asignación de Licencia en Transacción Atómica.
 * Principios aplicados:
 * - DIP: Solo depende de ILicenseUnitOfWork e IAssignmentNotificationDispatcher.
 * - Atomicidad (ACID): Ocupación del cupo, asociación y registro histórico en una única transacción.
 * - Resiliencia: El aviso por correo se despacha tras el commit de BD, con reintentos sin revertir la transacción.
 */
export class AssignLicenseCommandHandler {
  constructor(
    private readonly unitOfWork: ILicenseUnitOfWork,
    private readonly notificationDispatcher: IAssignmentNotificationDispatcher,
  ) {}

  async handle(command: AssignLicenseCommand): Promise<AssignmentResult> {
    const { idLicencia, idEmpleado, idUsuarioAsignacion, nota } = command.payload;
    const ahora = new Date();
    const hoy = diaDeConsulta(ahora);
    const claveAsignacion = randomUUID();

    // 1. Transacción atómica en base de datos
    const { asignacion, licencia, empleado } = await this.unitOfWork.executeInTransaction(
      async (repo) => {
        const lic = await repo.obtenerLicencia(idLicencia);
        if (!lic) {
          throw new BusinessError('Licencia no encontrada', 404);
        }

        // Validar vigencia
        if (lic.finVigencia <= hoy) {
          throw new BusinessError('No se puede asignar una licencia vencida', 400);
        }
        if (lic.inicioVigencia > hoy) {
          throw new BusinessError('No se puede asignar una licencia cuya vigencia aún no inicia', 400);
        }

        const emp = await repo.obtenerEmpleado(idEmpleado);
        if (!emp) {
          throw new BusinessError('Empleado no encontrado', 404);
        }

        if (!emp.activo) {
          throw new BusinessError('No se puede asignar una licencia a un empleado inactivo', 400);
        }

        // Comprobar que no tenga ya asignación activa
        const asignacionPrevia = await repo.buscarAsignacionAbierta(idLicencia, idEmpleado);
        if (asignacionPrevia) {
          throw new BusinessError(
            'El empleado ya cuenta con un cupo asignado para esta licencia',
            409,
          );
        }

        // Validar disponibilidad de cupos
        const cuposOcupados = await repo.contarCuposOcupados(idLicencia);
        if (cuposOcupados >= lic.cuposContratados) {
          throw new BusinessError(
            'No hay cupos disponibles para asignar en esta licencia',
            409,
          );
        }

        // Crear registro en AsignacionesLicencias
        const nuevaAsignacion = await repo.asignarCupo(
          { idLicencia, idEmpleado, idUsuarioAsignacion, nota },
          claveAsignacion,
          ahora,
        );

        return { asignacion: nuevaAsignacion, licencia: lic, empleado: emp };
      },
    );

    // 2. Disparo de aviso automático por correo con reintentos controlados
    const dispatchResult = await this.notificationDispatcher.dispatchAssignmentEmail(
      licencia,
      empleado,
      asignacion.asignadoEn,
      undefined,
      nota,
    );

    return {
      asignacion,
      licencia,
      empleado,
      correoNotificado: dispatchResult.sent,
      correoStatus: dispatchResult.status,
      correoReason: dispatchResult.reason,
    };
  }
}
