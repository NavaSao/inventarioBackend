import type { PrismaClient } from '../../generated/prisma/client.js';
import { prisma } from '../config/database.js';
import { EstadoActivo } from '../../domain/enums/EstadoActivo.js';
import { DIAS_AVISO_VENCIMIENTO } from '../../domain/models/Licencia.js';
import type { DashboardData, IDashboardReadModel } from '../../application/queries/dashboard/GetDashboardQueryHandler.js';

const DIA_MS = 24 * 60 * 60 * 1000;

/** Read model de solo lectura que agrega métricas de licencias para el dashboard. */
export class PrismaDashboardReadModel implements IDashboardReadModel {
  constructor(private readonly client: PrismaClient = prisma) {}

  async obtener(ahora: Date, limiteActividad: number): Promise<DashboardData> {
    const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));

    const [licencias, movimientos, conteoActivos] = await Promise.all([
      this.client.licencia.findMany({
        select: {
          idLicencia: true,
          software: true,
          finVigencia: true,
          cuposContratados: true,
          _count: { select: { asignaciones: { where: { liberadoEn: null } } } },
        },
      }),
      this.client.asignacionLicencia.findMany({
        orderBy: { actualizadoEn: 'desc' },
        take: limiteActividad,
        select: {
          idAsignacionLicencia: true,
          asignadoEn: true,
          liberadoEn: true,
          licencia: { select: { software: true } },
          empleado: { select: { nombre: true, correo: true } },
        },
      }),
      this.client.activo.groupBy({ by: ['estado'], _count: { _all: true } }),
    ]);

    const activosPorEstado = Object.fromEntries(
      Object.values(EstadoActivo).map((estado) => [estado, 0]),
    ) as DashboardData['activosPorEstado'];
    for (const fila of conteoActivos) activosPorEstado[fila.estado] = fila._count._all;

    let cuposTotales = 0;
    let cuposOcupados = 0;
    let cuposAsignables = 0;
    let aplicacionesActivas = 0;
    const vencimientos: DashboardData['vencimientosMenos30Dias'] = [];

    for (const l of licencias) {
      const ocupados = l._count.asignaciones;
      const vigente = l.finVigencia.getTime() >= hoy.getTime();
      const libres = Math.max(0, l.cuposContratados - ocupados);
      cuposTotales += l.cuposContratados;
      cuposOcupados += ocupados;
      if (vigente) {
        aplicacionesActivas += 1;
        cuposAsignables += libres;
        const dias = Math.round((l.finVigencia.getTime() - hoy.getTime()) / DIA_MS);
        if (dias > 0 && dias < DIAS_AVISO_VENCIMIENTO) {
          vencimientos.push({
            id: l.idLicencia,
            licenciaId: l.idLicencia,
            software: l.software,
            diasRestantes: dias,
            cupos: l.cuposContratados,
            finVigencia: l.finVigencia.toISOString().slice(0, 10),
          });
        }
      }
    }
    vencimientos.sort((a, b) => a.diasRestantes - b.diasRestantes);

    const actividadReciente = movimientos.map((m) => {
      const liberada = m.liberadoEn !== null;
      return {
        idMovimiento: `${m.idAsignacionLicencia}:${liberada ? 'liberacion' : 'asignacion'}`,
        tipo: liberada ? ('LIBERACION' as const) : ('ASIGNACION' as const),
        software: m.licencia.software,
        titulo: `${m.licencia.software} ${liberada ? 'liberado' : 'asignado'}`,
        empleado: { nombre: m.empleado.nombre, correo: m.empleado.correo },
        fecha: (m.liberadoEn ?? m.asignadoEn).toISOString(),
      };
    });

    return {
      activosPorEstado,
      metricas: {
        cuposTotales,
        aplicacionesActivas,
        cuposOcupados,
        cuposAsignables,
        cuposLibres: Math.max(0, cuposTotales - cuposOcupados),
        porcentajeUso: cuposTotales > 0 ? Math.round((cuposOcupados / cuposTotales) * 100) : 0,
      },
      vencimientosMenos30Dias: vencimientos,
      actividadReciente,
    };
  }
}
