import type { NextFunction, Request, Response } from 'express';
import type { IRegistrarLicenciaHandler } from '../../application/commands/licencias/RegistrarLicenciaHandler.js';
import type {
  ConsultarLicenciaHandler,
  ListarLicenciasHandler,
} from '../../application/queries/licencias/LicenciaHandlers.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import {
  filtrosLicenciaSchema,
  parametrosLicenciaSchema,
  registroLicenciaSchema,
  validarLicencia,
} from '../validators/licenciaValidator.js';

export class RegistrarLicenciaController {
  constructor(private readonly casoDeUso: IRegistrarLicenciaHandler) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const command = validarLicencia(registroLicenciaSchema, req.body);
      const licencia = await this.casoDeUso.handle(command);
      ResponseBuilder.success(res, licencia, 'Licencia registrada', 201);
    } catch (error) {
      next(error);
    }
  };
}

export class ListarLicenciasController {
  constructor(private readonly casoDeUso: Pick<ListarLicenciasHandler, 'handle'>) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = validarLicencia(filtrosLicenciaSchema, req.query);
      const licencias = await this.casoDeUso.handle(query);
      ResponseBuilder.success(res, licencias, 'Licencias consultadas');
    } catch (error) {
      next(error);
    }
  };
}

export class ConsultarLicenciaController {
  constructor(private readonly casoDeUso: Pick<ConsultarLicenciaHandler, 'handle'>) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idLicencia } = validarLicencia(parametrosLicenciaSchema, req.params);
      const licencia = await this.casoDeUso.handle(idLicencia);
      ResponseBuilder.success(res, licencia, 'Licencia consultada');
    } catch (error) {
      next(error);
    }
  };
}
