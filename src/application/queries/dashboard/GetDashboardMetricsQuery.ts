/**
 * DTO de Consulta para el Dashboard (CQRS - Query, HU08).
 */
export class GetDashboardMetricsQuery {
  constructor(public readonly fechaReferencia?: Date) {}
}
