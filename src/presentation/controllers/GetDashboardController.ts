import type { NextFunction, Request, Response } from 'express';
import type { GetDashboardQueryHandler } from '../../application/queries/dashboard/GetDashboardQueryHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';

/** Single Action Controller: GET /api/dashboard */
export class GetDashboardController {
  constructor(private readonly handler: GetDashboardQueryHandler) {}

  execute = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.handler.handle();
      ResponseBuilder.success(res, data, 'Dashboard consultado', 200);
    } catch (error) {
      next(error);
    }
  };
}
