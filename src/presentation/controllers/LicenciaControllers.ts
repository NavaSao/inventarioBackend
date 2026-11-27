import type { NextFunction, Request, Response } from 'express';
import type { IRegistrarLicenciaHandler } from '../../application/licencias/commands/registrar-licencia/IRegistrarLicenciaHandler.js';
import type { ConsultarLicenciaHandler } from '../../application/licencias/queries/consultar-licencia/ConsultarLicenciaHandler.js';
import type { ListarLicenciasHandler } from '../../application/licencias/queries/listar-licencias/ListarLicenciasHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { filtrosLicenciaSchema } from '../../application/licencias/queries/listar-licencias/ListarLicenciasValidator.js';
import { parametrosLicenciaSchema } from '../../application/licencias/queries/consultar-licencia/ConsultarLicenciaValidator.js';
import { registroLicenciaSchema } from '../../application/licencias/commands/registrar-licencia/RegistrarLicenciaValidator.js';
import { validarLicencia } from '../../application/licencias/validacionLicencia.js';

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
