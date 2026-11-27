import { randomUUID } from 'node:crypto';
import type {
  AssignmentResult,
  IAssignmentNotificationDispatcher,
  ILicenseUnitOfWork,
} from '../../../../domain/contracts/licenseAssignment.js';
import { BusinessError } from '../../../../domain/exceptions/BusinessError.js';
import { diaDeConsulta, resumirLicencia } from '../../../../domain/models/Licencia.js';
import type { AssignLicenseCommand } from './AssignLicenseCommand.js';

/**
 * Orquestador de Caso de Uso HU06: Asignación de Licencia en Transacción Atómica.
 * Principios aplicados:
 * - DIP: Solo depende de ILicenseUnitOfWork e IAssignmentNotificationDispatcher.
 * - Atomicidad (ACID): Bloqueo pesimista de fila, validación de cupos, asociación y registro histórico.
 * - Idempotencia: Recupera el movimiento previo ante reintentos de red sin consumir un cupo adicional.
 * - Resiliencia: El aviso por correo se despacha tras el commit de BD, con reintentos sin revertir la transacción.
 */
export class AssignLicenseCommandHandler {
  constructor(
    private readonly unitOfWork: ILicenseUnitOfWork,
    private readonly notificationDispatcher: IAssignmentNotificationDispatcher,
  ) {}

  async handle(command: AssignLicenseCommand): Promise<AssignmentResult> {
    const {
      idLicencia,
      idEmpleado,
      idUsuarioAsignacion,
      claveAsignacion: claveProporcionada,
      nota,
    } = command.payload;
    const ahora = new Date();
    const hoy = diaDeConsulta(ahora);
    const claveAsignacion = claveProporcionada ?? randomUUID();

    // 1. Transacción atómica en base de datos
    const txResult = await this.unitOfWork.executeInTransaction(async (repo) => {
      const lic = await repo.obtenerLicencia(idLicencia);
      if (!lic) {
        throw new BusinessError('Licencia no encontrada', 404);
      }

      // Idempotencia ante reintentos de red (Escenario 06.04)
      if (claveProporcionada && repo.buscarAsignacionPorClave) {
        const asignacionExistente = await repo.buscarAsignacionPorClave(claveProporcionada);
        if (asignacionExistente) {
          if (
            asignacionExistente.idLicencia !== idLicencia ||
            asignacionExistente.idEmpleado !== idEmpleado
          ) {
            throw new BusinessError(
              'La clave de asignación ya fue utilizada en otro movimiento',
              409,
            );
          }

          const empExistente = await repo.obtenerEmpleado(idEmpleado);
          if (!empExistente) {
            throw new BusinessError('Empleado no encontrado', 404);
          }

          const cuposOcupadosActuales = await repo.contarCuposOcupados(idLicencia);
          const resumenExistente = resumirLicencia(lic, cuposOcupadosActuales, hoy);

          return {
            asignacion: asignacionExistente,
            licencia: lic,
            empleado: empExistente,
            resumen: resumenExistente,
            reintentoRecuperado: true,
            nombreUsuarioAsignacion: undefined,
          };
        }
      }

      // Validar vigencia (Escenario 06.02)
      if (lic.finVigencia <= hoy) {
        throw new BusinessError('No se puede asignar una licencia vencida', 400);
      }
      if (lic.inicioVigencia > hoy) {
        throw new BusinessError(
          'No se puede asignar una licencia cuya vigencia aún no inicia',
          400,
        );
      }

      const emp = await repo.obtenerEmpleado(idEmpleado);
      if (!emp) {
        throw new BusinessError('Empleado no encontrado', 404);
      }

      if (!emp.activo) {
        throw new BusinessError('No se puede asignar una licencia a un empleado inactivo', 400);
      }

      // Comprobar que no tenga ya asignación activa (Escenario 06.02)
      const asignacionPrevia = await repo.buscarAsignacionAbierta(idLicencia, idEmpleado);
      if (asignacionPrevia) {
        throw new BusinessError(
          'El empleado ya cuenta con un cupo asignado para esta licencia',
          409,
        );
      }

      // Validar disponibilidad de cupos (Escenarios 06.02 y 06.03)
      const cuposOcupados = await repo.contarCuposOcupados(idLicencia);
      if (cuposOcupados >= lic.cuposContratados) {
        throw new BusinessError('No hay cupos disponibles para asignar en esta licencia', 409);
      }

      // Crear registro en AsignacionesLicencias
      const nuevaAsignacion = await repo.asignarCupo(
        { idLicencia, idEmpleado, idUsuarioAsignacion, claveAsignacion, nota },
        claveAsignacion,
        ahora,
      );

      const cuposOcupadosDespues = cuposOcupados + 1;
      const resumen = resumirLicencia(lic, cuposOcupadosDespues, hoy);
      const nombreUsuarioAsignacion = repo.obtenerNombreUsuario
        ? ((await repo.obtenerNombreUsuario(idUsuarioAsignacion)) ?? undefined)
        : undefined;

      return {
        asignacion: nuevaAsignacion,
        licencia: lic,
        empleado: emp,
        resumen,
        reintentoRecuperado: false,
        nombreUsuarioAsignacion,
      };
    });

    const { asignacion, licencia, empleado, resumen, reintentoRecuperado, nombreUsuarioAsignacion } =
      txResult;

    // 2. Si el movimiento fue recuperado por reintento idempotente, no se duplica el correo ni se consume otro cupo
    if (reintentoRecuperado) {
      return {
        asignacion,
        licencia,
        empleado,
        cuposAsignados: resumen.cuposAsignados,
        cuposLibresResultantes: resumen.cuposLibres,
        cuposLibresActualizados: resumen.cuposLibres,
        cuposAsignables: resumen.cuposAsignables,
        porcentajeOcupacion: resumen.porcentajeOcupacion,
        estadoLicencia: resumen.estado,
        reintentoRecuperado: true,
        correoNotificado: false,
        correoStatus: 'SKIPPED',
        correoReason: 'Movimiento recuperado por reintento idempotente',
      };
    }

    // 3. Disparo de aviso automático por correo con reintentos controlados (Escenario 06.01)
    const dispatchResult = await this.notificationDispatcher.dispatchAssignmentEmail(
      licencia,
      empleado,
      asignacion.asignadoEn,
      nombreUsuarioAsignacion,
      nota,
    );

    return {
      asignacion,
      licencia,
      empleado,
      cuposAsignados: resumen.cuposAsignados,
      cuposLibresResultantes: resumen.cuposLibres,
      cuposLibresActualizados: resumen.cuposLibres,
      cuposAsignables: resumen.cuposAsignables,
      porcentajeOcupacion: resumen.porcentajeOcupacion,
      estadoLicencia: resumen.estado,
      reintentoRecuperado: false,
      correoNotificado: dispatchResult.sent,
      correoStatus: dispatchResult.status,
      correoReason: dispatchResult.reason,
    };
  }
}
