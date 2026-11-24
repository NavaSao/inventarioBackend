import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { GetLicenseHistoryQuery } from '../../application/queries/licencias/GetLicenseHistoryQuery.js';
import type { GetLicenseHistoryQueryHandler } from '../../application/queries/licencias/GetLicenseHistoryQueryHandler.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { assignLicenseParamSchema } from '../validators/licenseAssignmentValidator.js';

/**
 * Single Action Controller para consultar el historial de movimientos de una licencia (HU07).
 */
export class GetLicenseHistoryController {
  constructor(private readonly handler: GetLicenseHistoryQueryHandler) {}

  execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = assignLicenseParamSchema.parse(req.params);
      const historial = await this.handler.handle(new GetLicenseHistoryQuery(params.idLicencia));
      ResponseBuilder.success(res, historial, 'Historial de licencia consultado', 200);
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Identificador de licencia inválido', error.issues));
        return;
      }
      next(error);
    }
  };
}

