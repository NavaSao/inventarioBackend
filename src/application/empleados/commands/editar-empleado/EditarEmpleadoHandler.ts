import type { IEmpleadoRepository } from '../../../../domain/contracts/empleados.js';
import { BusinessError } from '../../../../domain/exceptions/BusinessError.js';
import type { Empleado } from '../../../../domain/models/Empleado.js';
import type { EditarEmpleadoCommand } from './EditarEmpleadoCommand.js';

export class EditarEmpleadoHandler {
  constructor(private readonly repositorio: IEmpleadoRepository) {}

  async handle(command: EditarEmpleadoCommand): Promise<Empleado> {
    const empleadoActual = await this.repositorio.buscarPorId(command.idEmpleado);
    if (!empleadoActual) {
      throw new BusinessError('Empleado no encontrado', 404);
    }

    if (command.correo.toLowerCase() !== empleadoActual.correo.toLowerCase()) {
      const existentePorCorreo = await this.repositorio.buscarPorCorreo(command.correo);
      if (existentePorCorreo && existentePorCorreo.idEmpleado !== command.idEmpleado) {
        throw new BusinessError('El correo electrónico ya está registrado por otro empleado', 409);
      }
    }

    if (command.numeroEmpleado !== empleadoActual.numeroEmpleado) {
      const existentePorNumero = await this.repositorio.buscarPorNumeroEmpleado(command.numeroEmpleado);
      if (existentePorNumero && existentePorNumero.idEmpleado !== command.idEmpleado) {
        throw new BusinessError('El número de empleado ya está registrado por otro empleado', 409);
      }
    }

    return this.repositorio.editar(command.idEmpleado, {
      numeroEmpleado: command.numeroEmpleado,
      nombre: command.nombre,
      correo: command.correo,
      departamento: command.departamento,
      cargo: command.cargo,
    });
  }
}
