import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { SearchEmployeesSelectorQuery } from '../../application/queries/empleados/SearchEmployeesSelectorQuery.js';
import type { SearchEmployeesSelectorQueryHandler } from '../../application/queries/empleados/SearchEmployeesSelectorQueryHandler.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { employeeSelectorSchema } from '../validators/employeeSearchValidator.js';

/**
 * Single Action Controller para el Selector Rápido de Empleados (HU03).
 */
export class SearchEmployeesSelectorController {
  constructor(private readonly handler: SearchEmployeesSelectorQueryHandler) {}

  execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = employeeSelectorSchema.parse(req.query);
      const query = new SearchEmployeesSelectorQuery({
        busqueda: parsed.busqueda || parsed.q,
        soloActivos: parsed.soloActivos,
        limite: parsed.limite,
      });

      const empleados = await this.handler.handle(query);
      ResponseBuilder.success(res, empleados, 'Listado para selector obtenido exitosamente', 200);
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Parámetros de selector inválidos', error.issues));
        return;
      }
      next(error);
    }
  };
}
