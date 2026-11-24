import type { IDashboardReadModel } from '../../../domain/contracts/dashboard.js';
import type { ResumenDashboard } from '../../../domain/models/Dashboard.js';
import type { GetDashboardMetricsQuery } from './GetDashboardMetricsQuery.js';

export interface IGetDashboardMetricsQueryHandler {
  handle(query?: GetDashboardMetricsQuery): Promise<ResumenDashboard>;
}

/**
 * Caso de Uso HU08: Orquestador para obtener las métricas y movimientos del dashboard.
 */
export class GetDashboardMetricsQueryHandler implements IGetDashboardMetricsQueryHandler {
  constructor(private readonly dashboardReadModel: IDashboardReadModel) {}

  async handle(query?: GetDashboardMetricsQuery): Promise<ResumenDashboard> {
    return this.dashboardReadModel.obtenerMetricas(query?.fechaReferencia);
  }
}
