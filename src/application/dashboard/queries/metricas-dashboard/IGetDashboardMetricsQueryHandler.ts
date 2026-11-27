import type { ResumenDashboard } from '../../../../domain/models/Dashboard.js';
import type { GetDashboardMetricsQuery } from './GetDashboardMetricsQuery.js';

export interface IGetDashboardMetricsQueryHandler {
  handle(query?: GetDashboardMetricsQuery): Promise<ResumenDashboard>;
}
