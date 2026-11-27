import type { NextFunction, Request, Response } from 'express';
import type { RegistrarEmpleadoHandler } from '../../application/empleados/commands/registrar-empleado/RegistrarEmpleadoHandler.js';
import type { EditarEmpleadoHandler } from '../../application/empleados/commands/editar-empleado/EditarEmpleadoHandler.js';
import type { DesactivarEmpleadoHandler } from '../../application/empleados/commands/desactivar-empleado/DesactivarEmpleadoHandler.js';
import type { ListarEmpleadosHandler } from '../../application/empleados/queries/listar-empleados/ListarEmpleadosHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { validarDesactivacionEmpleado } from '../../application/empleados/commands/desactivar-empleado/DesactivarEmpleadoValidator.js';
import { editarEmpleadoSchema } from '../../application/empleados/commands/editar-empleado/EditarEmpleadoValidator.js';
import { parametrosEmpleadoSchema, validarEmpleado } from '../../application/empleados/validacionEmpleado.js';
import { registroEmpleadoSchema } from '../../application/empleados/commands/registrar-empleado/RegistrarEmpleadoValidator.js';

export class RegistrarEmpleadoController {
  constructor(private readonly casoDeUso: RegistrarEmpleadoHandler) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const command = validarEmpleado(registroEmpleadoSchema, req.body);
      const empleado = await this.casoDeUso.handle(command);
      ResponseBuilder.success(res, empleado, 'Empleado registrado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };
}

export class ListarEmpleadosController {
  constructor(private readonly casoDeUso: ListarEmpleadosHandler) {}

  public execute = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const empleados = await this.casoDeUso.handle();
      ResponseBuilder.success(res, empleados, 'Empleados consultados exitosamente');
    } catch (error) {
      next(error);
    }
  };
}

export class EditarEmpleadoController {
  constructor(private readonly casoDeUso: EditarEmpleadoHandler) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validarEmpleado(parametrosEmpleadoSchema, req.params);
      const datos = validarEmpleado(editarEmpleadoSchema, req.body);
      const empleado = await this.casoDeUso.handle({
        idEmpleado: id,
        ...datos,
      });
      ResponseBuilder.success(res, empleado, 'Empleado actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  };
}

export class DesactivarEmpleadoController {
  constructor(private readonly casoDeUso: DesactivarEmpleadoHandler) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validarDesactivacionEmpleado(req.params);
      const empleado = await this.casoDeUso.handle({ idEmpleado: id });
      ResponseBuilder.success(res, empleado, 'Empleado desactivado exitosamente');
    } catch (error) {
      next(error);
    }
  };
}
