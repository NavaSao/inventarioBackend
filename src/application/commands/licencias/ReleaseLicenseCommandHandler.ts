import { randomUUID } from 'node:crypto';
import type {
  ILicenseUnitOfWork,
  ReleaseResult,
} from '../../../domain/contracts/licenseAssignment.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import { diaDeConsulta, resumirLicencia } from '../../../domain/models/Licencia.js';
import type { ReleaseLicenseCommand } from './ReleaseLicenseCommand.js';

function resolverFechaLiberacion(
  fechaInput: Date | string | undefined,
  asignadoEn: Date,
  ahora: Date,
): Date {
  if (fechaInput === undefined) {
    return ahora >= asignadoEn ? ahora : asignadoEn;
  }

  if (typeof fechaInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaInput.trim())) {
    const fechaStr = fechaInput.trim();
    const fechaInicioDia = new Date(`${fechaStr}T00:00:00.000Z`);
    if (
      Number.isNaN(fechaInicioDia.getTime()) ||
      fechaInicioDia.toISOString().slice(0, 10) !== fechaStr
    ) {
      throw new BusinessError('La fecha de liberación no es válida', 400);
    }

    const hoyStr = diaDeConsulta(ahora).toISOString().slice(0, 10);
    if (fechaStr > hoyStr) {
      throw new BusinessError('La fecha de liberación no puede ser futura', 400);
    }

    if (fechaStr === hoyStr) {
      return ahora >= asignadoEn ? ahora : asignadoEn;
    }

    const finDeDia = new Date(`${fechaStr}T23:59:59.999Z`);
    if (finDeDia < asignadoEn) {
      throw new BusinessError(
        'La fecha de liberación no puede ser anterior a la fecha de asignación',
        400,
      );
    }
    return finDeDia;
  }

  const fecha = fechaInput instanceof Date ? fechaInput : new Date(fechaInput);
  if (Number.isNaN(fecha.getTime())) {
    throw new BusinessError('La fecha de liberación no es válida', 400);
  }

  if (fecha.getTime() > ahora.getTime() + 60_000) {
    throw new BusinessError('La fecha de liberación no puede ser futura', 400);
  }

  if (fecha < asignadoEn) {
    throw new BusinessError(
      'La fecha de liberación no puede ser anterior a la fecha de asignación',
      400,
    );
  }

  return fecha;
}

/**
 * Orquestador de Caso de Uso HU07: Liberación de Licencias (incluyendo licencias vencidas).
 * Principios aplicados:
 * - DIP: Depende exclusivamente de ILicenseUnitOfWork.
 * - Atomicidad: Bloquea la licencia, cierra la asignación abierta conservando historial y recalcula ocupación.
 * - Idempotencia: Recupera liberaciones previas cuando se reintenta con la misma claveLiberacion.
 */
export class ReleaseLicenseCommandHandler {
  constructor(private readonly unitOfWork: ILicenseUnitOfWork) {}

  async handle(command: ReleaseLicenseCommand): Promise<ReleaseResult> {
    const {
      idAsignacionLicencia,
      idLicencia,
      idEmpleado,
      idUsuarioLiberacion,
      claveLiberacion: claveProporcionada,
      fechaLiberacion,
      nota,
    } = command.payload;

    if (!idAsignacionLicencia && !(idLicencia && idEmpleado)) {
      throw new BusinessError(
        'Debes indicar el identificador de asignación o el par licencia y empleado',
        400,
      );
    }

    const ahora = new Date();
    const hoy = diaDeConsulta(ahora);
    const claveLiberacion = claveProporcionada ?? randomUUID();

    return this.unitOfWork.executeInTransaction(async (repo) => {
      // Idempotencia ante reintentos de red con claveLiberacion
      if (claveProporcionada && repo.buscarAsignacionPorClaveLiberacion) {
        const previa = await repo.buscarAsignacionPorClaveLiberacion(claveProporcionada);
        if (previa) {
          const coincidePorId =
            idAsignacionLicencia && previa.idAsignacionLicencia === idAsignacionLicencia;
          const coincidePorPar =
            !idAsignacionLicencia &&
            idLicencia &&
            idEmpleado &&
            previa.idLicencia === idLicencia &&
            previa.idEmpleado === idEmpleado;

          if (!coincidePorId && !coincidePorPar) {
            throw new BusinessError(
              'La clave de liberación ya fue utilizada en otro movimiento',
              409,
            );
          }

          const licencia = await repo.obtenerLicencia(previa.idLicencia);
          if (!licencia) {
            throw new BusinessError('Licencia asociada no encontrada', 404);
          }

          const empleado = await repo.obtenerEmpleado(previa.idEmpleado);
          if (!empleado) {
            throw new BusinessError('Empleado asociado no encontrado', 404);
          }

          const cuposOcupados = await repo.contarCuposOcupados(licencia.idLicencia);
          const resumen = resumirLicencia(licencia, cuposOcupados, hoy);

          return {
            asignacion: previa,
            licencia,
            empleado,
            cuposAsignados: resumen.cuposAsignados,
            cuposLibresActualizados: resumen.cuposLibres,
            cuposAsignables: resumen.cuposAsignables,
            porcentajeOcupacion: resumen.porcentajeOcupacion,
            estadoLicencia: resumen.estado,
            reintentoRecuperado: true,
          };
        }
      }

      let asignacion = idAsignacionLicencia
        ? await repo.buscarAsignacionPorId(idAsignacionLicencia)
        : await repo.buscarAsignacionAbierta(idLicencia!, idEmpleado!);

      if (!asignacion) {
        throw new BusinessError('Asignación de licencia no encontrada', 404);
      }

      // Bloquear fila de la licencia para serializar liberaciones y asignaciones concurrentes
      const licencia = await repo.obtenerLicencia(asignacion.idLicencia);
      if (!licencia) {
        throw new BusinessError('Licencia asociada no encontrada', 404);
      }

      // Revalidar tras adquirir el bloqueo de fila
      if (idAsignacionLicencia) {
        asignacion = (await repo.buscarAsignacionPorId(idAsignacionLicencia)) ?? asignacion;
      }

      if (asignacion.liberadoEn !== null) {
        throw new BusinessError('La asignación ya ha sido liberada previamente', 400);
      }

      const fechaEfectiva = resolverFechaLiberacion(fechaLiberacion, asignacion.asignadoEn, ahora);

      const asignacionLiberada = await repo.liberarCupo(
        asignacion.idAsignacionLicencia,
        idUsuarioLiberacion,
        claveLiberacion,
        fechaEfectiva,
        nota,
      );

      const empleado = await repo.obtenerEmpleado(asignacion.idEmpleado);
      if (!empleado) {
        throw new BusinessError('Empleado asociado no encontrado', 404);
      }

      const cuposOcupados = await repo.contarCuposOcupados(licencia.idLicencia);
      const resumen = resumirLicencia(licencia, cuposOcupados, hoy);

      return {
        asignacion: asignacionLiberada,
        licencia,
        empleado,
        cuposAsignados: resumen.cuposAsignados,
        cuposLibresActualizados: resumen.cuposLibres,
        cuposAsignables: resumen.cuposAsignables,
        porcentajeOcupacion: resumen.porcentajeOcupacion,
        estadoLicencia: resumen.estado,
        reintentoRecuperado: false,
      };
    });
  }
}
