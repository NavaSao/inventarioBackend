import type { IEmpleadoRepository } from '../../../domain/contracts/empleados.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import type { DatosCrearEmpleado, Empleado } from '../../../domain/models/Empleado.js';
import { SendWelcomeEmailCommand } from '../notifications/SendWelcomeEmailCommand.js';
import type { SendWelcomeEmailHandler } from '../notifications/SendWelcomeEmailHandler.js';

export interface RegistrarEmpleadoCommand extends DatosCrearEmpleado {
  enviarCorreoBienvenida?: boolean;
}

export class RegistrarEmpleadoHandler {
  constructor(
    private readonly repositorio: IEmpleadoRepository,
    private readonly welcomeEmailHandler?: Pick<SendWelcomeEmailHandler, 'handle'>,
  ) {}

  async handle(command: RegistrarEmpleadoCommand): Promise<Empleado> {
    const existePorCorreo = await this.repositorio.buscarPorCorreo(command.correo);
    if (existePorCorreo) {
      throw new BusinessError('El correo electrónico ya está registrado', 409);
    }

    const existePorNumero = await this.repositorio.buscarPorNumeroEmpleado(command.numeroEmpleado);
    if (existePorNumero) {
      throw new BusinessError('El número de empleado ya está registrado', 409);
    }

    const empleado = await this.repositorio.crear({
      numeroEmpleado: command.numeroEmpleado,
      nombre: command.nombre,
      correo: command.correo,
      departamento: command.departamento,
      cargo: command.cargo,
    });

    if (command.enviarCorreoBienvenida && this.welcomeEmailHandler) {
      await this.welcomeEmailHandler.handle(
        new SendWelcomeEmailCommand(
          empleado.nombre,
          empleado.correo,
          'EMPLEADO',
          true,
          empleado.numeroEmpleado,
          empleado.departamento ?? undefined,
        ),
      );
    }

    return empleado;
  }
}
