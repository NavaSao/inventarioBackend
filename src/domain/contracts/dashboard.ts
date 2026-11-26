import type { ResumenDashboard } from '../models/Dashboard.js';

/**
 * Contrato del Read Model para el Dashboard (CQRS - Consultas, HU08).
 * Desacopla la orquestación de la persistencia directa (DIP e ISP).
 */
export interface IDashboardReadModel {
  obtenerMetricas(hoy?: Date): Promise<ResumenDashboard>;
}
