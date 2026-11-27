import type { IDashboardReadModel } from '../../../../domain/contracts/IDashboardReadModel.js';
import type { ResumenDashboard } from '../../../../domain/models/Dashboard.js';
import type { GetDashboardMetricsQuery } from './GetDashboardMetricsQuery.js';
import type { IGetDashboardMetricsQueryHandler } from './IGetDashboardMetricsQueryHandler.js';

/**
 * Caso de Uso HU08: Orquestador para obtener las métricas y movimientos del dashboard.
 */
export class GetDashboardMetricsQueryHandler implements IGetDashboardMetricsQueryHandler {
  constructor(private readonly dashboardReadModel: IDashboardReadModel) {}

  async handle(query?: GetDashboardMetricsQuery): Promise<ResumenDashboard> {
    return this.dashboardReadModel.obtenerMetricas(query?.fechaReferencia);
  }
}
