import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { SearchEmployeesQuery } from '../../application/queries/empleados/SearchEmployeesQuery.js';
import type { SearchEmployeesQueryHandler } from '../../application/queries/empleados/SearchEmployeesQueryHandler.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { employeeFilterSchema } from '../validators/employeeSearchValidator.js';

/**
 * Single Action Controller para Búsqueda y Filtrado de Empleados (HU03).
 * Cumple Single Responsibility: Una única acción pública execute, cero lógica de negocio.
 */
export class SearchEmployeesController {
  constructor(private readonly handler: SearchEmployeesQueryHandler) {}

  execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const criteria = employeeFilterSchema.parse(req.query);
      const query = new SearchEmployeesQuery(criteria);
      const empleados = await this.handler.handle(query);

      ResponseBuilder.success(res, empleados, 'Empleados consultados exitosamente', 200);
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Parámetros de búsqueda inválidos', error.issues));
        return;
      }
      next(error);
    }
  };
}
