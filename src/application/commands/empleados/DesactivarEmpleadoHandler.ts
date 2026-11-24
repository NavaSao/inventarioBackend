import type { IEmpleadoRepository } from '../../../domain/contracts/empleados.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import type { Empleado } from '../../../domain/models/Empleado.js';

export interface DesactivarEmpleadoCommand {
  idEmpleado: string;
}

export class DesactivarEmpleadoHandler {
  constructor(private readonly repositorio: IEmpleadoRepository) {}

  async handle(command: DesactivarEmpleadoCommand): Promise<Empleado> {
    const empleado = await this.repositorio.buscarPorId(command.idEmpleado);
    if (!empleado) {
      throw new BusinessError('Empleado no encontrado', 404);
    }

    const licenciasActivas = await this.repositorio.contarLicenciasActivas(command.idEmpleado);
    if (licenciasActivas > 0) {
      throw new BusinessError(
        'No se puede desactivar el empleado porque tiene licencias activas asignadas. Debe liberar sus licencias antes de inactivarlo.',
        409,
      );
    }

    return this.repositorio.desactivar(command.idEmpleado);
  }
}
