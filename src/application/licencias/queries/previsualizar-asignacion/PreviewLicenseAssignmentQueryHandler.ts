import type {
  AssignmentPreviewResult,
  ILicenseAssignmentRepository,
} from '../../../../domain/contracts/licenseAssignment.js';
import { BusinessError } from '../../../../domain/exceptions/BusinessError.js';
import { diaDeConsulta, resumirLicencia } from '../../../../domain/models/Licencia.js';
import type { PreviewLicenseAssignmentQuery } from './PreviewLicenseAssignmentQuery.js';

/**
 * Orquestador de lectura para previsualizar puestos libres y ocupación resultantes
 * en el Paso 2 del flujo guiado de asignación (HU06 - Escenario 06.01).
 */
export class PreviewLicenseAssignmentQueryHandler {
  constructor(private readonly repository: ILicenseAssignmentRepository) {}

  async handle(query: PreviewLicenseAssignmentQuery): Promise<AssignmentPreviewResult> {
    const { idLicencia, idEmpleado } = query.payload;
    const hoy = diaDeConsulta();

    const licencia = await this.repository.obtenerLicencia(idLicencia);
    if (!licencia) {
      throw new BusinessError('Licencia no encontrada', 404);
    }

    const empleado = await this.repository.obtenerEmpleado(idEmpleado);
    if (!empleado) {
      throw new BusinessError('Empleado no encontrado', 404);
    }

    const cuposOcupados = await this.repository.contarCuposOcupados(idLicencia);
    const resumenActual = resumirLicencia(licencia, cuposOcupados, hoy);
    const asignacionPrevia = await this.repository.buscarAsignacionAbierta(idLicencia, idEmpleado);

    let motivoRechazo: string | null = null;
    if (licencia.finVigencia <= hoy) {
      motivoRechazo = 'No se puede asignar una licencia vencida';
    } else if (licencia.inicioVigencia > hoy) {
      motivoRechazo = 'No se puede asignar una licencia cuya vigencia aún no inicia';
    } else if (!empleado.activo) {
      motivoRechazo = 'No se puede asignar una licencia a un empleado inactivo';
    } else if (asignacionPrevia) {
      motivoRechazo = 'El empleado ya cuenta con un cupo asignado para esta licencia';
    } else if (cuposOcupados >= licencia.cuposContratados) {
      motivoRechazo = 'No hay cupos disponibles para asignar en esta licencia';
    }

    const puedeAsignar = motivoRechazo === null;
    const cuposLibresActuales = resumenActual.cuposLibres;
    const cuposLibresResultantes = puedeAsignar
      ? Math.max(cuposLibresActuales - 1, 0)
      : cuposLibresActuales;
    const porcentajeOcupacionResultante = puedeAsignar
      ? Math.round(((cuposOcupados + 1) * 100) / licencia.cuposContratados)
      : resumenActual.porcentajeOcupacion;

    return {
      licencia: resumenActual,
      empleado: {
        idEmpleado: empleado.idEmpleado,
        numeroEmpleado: empleado.numeroEmpleado,
        nombre: empleado.nombre,
        correo: empleado.correo,
        departamento: empleado.departamento,
        cargo: empleado.cargo,
        activo: empleado.activo,
      },
      puedeAsignar,
      motivoRechazo,
      cuposLibresActuales,
      cuposLibresResultantes,
      porcentajeOcupacionActual: resumenActual.porcentajeOcupacion,
      porcentajeOcupacionResultante,
    };
  }
}

