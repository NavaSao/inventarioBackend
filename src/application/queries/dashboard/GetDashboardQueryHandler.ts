import type { EstadoActivo } from '../../../domain/enums/EstadoActivo.js';

export interface DashboardData {
  activosPorEstado: Record<EstadoActivo, number>;
  metricas: {
    cuposTotales: number;
    aplicacionesActivas: number;
    cuposOcupados: number;
    cuposAsignables: number;
    cuposLibres: number;
    porcentajeUso: number;
  };
  vencimientosMenos30Dias: Array<{
    id: string;
    licenciaId: string;
    software: string;
    diasRestantes: number;
    cupos: number;
    finVigencia: string;
  }>;
  actividadReciente: Array<{
    idMovimiento: string;
    tipo: 'ASIGNACION' | 'LIBERACION';
    software: string;
    titulo: string;
    empleado: { nombre: string; correo: string };
    fecha: string;
  }>;
}

export interface IDashboardReadModel {
  obtener(ahora: Date, limiteActividad: number): Promise<DashboardData>;
}

/** Query handler (CQRS) del resumen del dashboard. */
export class GetDashboardQueryHandler {
  constructor(
    private readonly readModel: IDashboardReadModel,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  handle(limiteActividad = 10): Promise<DashboardData> {
    return this.readModel.obtener(this.reloj(), limiteActividad);
  }
}
