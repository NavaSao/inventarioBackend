/**
 * Modelos de dominio y DTOs para el Dashboard de Métricas y Actividad (HU08).
 */

export interface ContratoResumenDashboard {
  idLicencia: string;
  codigoLicencia: string;
  software: string;
  plan: string | null;
  finVigencia: string;
  diasParaVencer: number;
  cuposContratados: number;
  cuposAsignados: number;
  cuposLibres: number;
  cuposAsignables: number;
}

export interface AlertaVencimientoSeccion {
  total: number;
  contratos: ContratoResumenDashboard[];
}

export interface AlertasVencimientoDashboard {
  vencimientosMenos30Dias: AlertaVencimientoSeccion;
  vencidos: AlertaVencimientoSeccion;
}

export interface MetricasDashboard {
  aplicacionesActivas: number;
  totalContratos: number;
  cuposTotales: number;
  cuposOcupados: number;
  porcentajeUso: number;
  cuposLibres: number;
  cuposAsignables: number;
}

export type TipoMovimientoDashboard = 'ASIGNACION' | 'LIBERACION';

export interface MovimientoEmpleadoResumen {
  idEmpleado: string;
  nombre: string;
  correo: string;
  numeroEmpleado: string;
  departamento: string | null;
}

export interface MovimientoUsuarioResumen {
  idUsuario: string;
  nombre: string;
  correo: string;
}

export interface MovimientoRecienteDashboard {
  idMovimiento: string;
  tipo: TipoMovimientoDashboard;
  fecha: Date;
  software: string;
  codigoLicencia: string;
  empleado: MovimientoEmpleadoResumen;
  realizadoPor: MovimientoUsuarioResumen;
  nota: string | null;
}

export interface ResumenDashboard {
  fechaConsulta: string;
  metricas: MetricasDashboard;
  alertas: AlertasVencimientoDashboard;
  actividadReciente: MovimientoRecienteDashboard[];
}
