import type { NextFunction, Request, Response } from 'express';
import type { IGetDashboardMetricsQueryHandler } from '../../application/queries/dashboard/GetDashboardMetricsQueryHandler.js';
import { GetDashboardMetricsQuery } from '../../application/queries/dashboard/GetDashboardMetricsQuery.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';

/**
 * Controlador Single Action para el Dashboard (HU08, SRP).
 */
export class DashboardController {
  constructor(private readonly casoDeUso: IGetDashboardMetricsQueryHandler) {}

  public execute = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resumen = await this.casoDeUso.handle(new GetDashboardMetricsQuery());
      ResponseBuilder.success(res, resumen, 'Métricas del dashboard consultadas exitosamente');
    } catch (error) {
      next(error);
    }
  };
}
