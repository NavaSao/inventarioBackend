import type { IDashboardReadModel } from '../../domain/contracts/IDashboardReadModel.js';
import type {
  ContratoResumenDashboard,
  MovimientoRecienteDashboard,
  ResumenDashboard,
} from '../../domain/models/Dashboard.js';
import { DIAS_AVISO_VENCIMIENTO, diaDeConsulta } from '../../domain/models/Licencia.js';
import { type PrismaClient } from '../../generated/prisma/client.js';
import { prisma } from '../config/database.js';

const UN_DIA_MS = 86_400_000;

export class PrismaDashboardRepository implements IDashboardReadModel {
  constructor(private readonly client: PrismaClient = prisma) {}

  async obtenerMetricas(hoy = diaDeConsulta()): Promise<ResumenDashboard> {
    // 1. Consultar todos los contratos de licencias con el conteo de asignaciones abiertas
    const licencias = await this.client.licencia.findMany({
      select: {
        idLicencia: true,
        codigoLicencia: true,
        software: true,
        plan: true,
        inicioVigencia: true,
        finVigencia: true,
        cuposContratados: true,
        _count: {
          select: {
            asignaciones: {
              where: { liberadoEn: null },
            },
          },
        },
      },
      orderBy: { finVigencia: 'asc' },
    });

    // 2. Procesar cálculos y métricas
    let cuposTotales = 0;
    let cuposOcupados = 0;
    let cuposAsignablesTotales = 0;

    const appsActivasSet = new Set<string>();
    const contratosMenos30Dias: ContratoResumenDashboard[] = [];
    const contratosVencidos: ContratoResumenDashboard[] = [];

    for (const lic of licencias) {
      const finTime = lic.finVigencia.getTime();
      const hoyTime = hoy.getTime();
      const diasParaVencer = Math.ceil((finTime - hoyTime) / UN_DIA_MS);

      const cuposAsignados = lic._count.asignaciones;
      const cuposLibres = Math.max(lic.cuposContratados - cuposAsignados, 0);

      const estaVencida = diasParaVencer <= 0;
      const vigenciaIniciada = lic.inicioVigencia.getTime() <= hoyTime;
      const cuposAsignables = !estaVencida && vigenciaIniciada ? cuposLibres : 0;

      cuposTotales += lic.cuposContratados;
      cuposOcupados += cuposAsignados;
      cuposAsignablesTotales += cuposAsignables;

      if (!estaVencida) {
        appsActivasSet.add(lic.software.trim().toLowerCase());
      }

      const resumenContrato: ContratoResumenDashboard = {
        idLicencia: lic.idLicencia,
        codigoLicencia: lic.codigoLicencia,
        software: lic.software,
        plan: lic.plan,
        finVigencia: lic.finVigencia.toISOString().slice(0, 10),
        diasParaVencer,
        cuposContratados: lic.cuposContratados,
        cuposAsignados,
        cuposLibres,
        cuposAsignables,
      };

      if (estaVencida) {
        contratosVencidos.push(resumenContrato);
      } else if (diasParaVencer <= DIAS_AVISO_VENCIMIENTO) {
        contratosMenos30Dias.push(resumenContrato);
      }
    }

    const porcentajeUso = cuposTotales > 0
      ? Math.round((cuposOcupados * 100) / cuposTotales)
      : 0;

    const cuposLibresTotales = Math.max(cuposTotales - cuposOcupados, 0);

    // 3. Consultar actividad reciente (movimientos de asignaciones y liberaciones de Jacob)
    const asignacionesRecientes = await this.client.asignacionLicencia.findMany({
      take: 30,
      include: {
        licencia: {
          select: {
            codigoLicencia: true,
            software: true,
          },
        },
        empleado: {
          select: {
            idEmpleado: true,
            nombre: true,
            correo: true,
            numeroEmpleado: true,
            departamento: true,
          },
        },
        asignadoPor: {
          select: {
            idUsuario: true,
            nombre: true,
            correo: true,
          },
        },
        liberadoPor: {
          select: {
            idUsuario: true,
            nombre: true,
            correo: true,
          },
        },
      },
      orderBy: { actualizadoEn: 'desc' },
    });

    const movimientos: MovimientoRecienteDashboard[] = [];

    for (const item of asignacionesRecientes) {
      // Movimiento de Asignación
      movimientos.push({
        idMovimiento: `asig-${item.idAsignacionLicencia}`,
        tipo: 'ASIGNACION',
        fecha: item.asignadoEn,
        software: item.licencia.software,
        codigoLicencia: item.licencia.codigoLicencia,
        empleado: item.empleado,
        realizadoPor: item.asignadoPor,
        nota: item.nota,
      });

      // Movimiento de Liberación (si ya fue liberado)
      if (item.liberadoEn && item.liberadoPor) {
        movimientos.push({
          idMovimiento: `lib-${item.idAsignacionLicencia}`,
          tipo: 'LIBERACION',
          fecha: item.liberadoEn,
          software: item.licencia.software,
          codigoLicencia: item.licencia.codigoLicencia,
          empleado: item.empleado,
          realizadoPor: item.liberadoPor,
          nota: item.nota,
        });
      }
    }

    // Ordenar cronológicamente descendente y limitar a los 15 más recientes
    movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    const actividadReciente = movimientos.slice(0, 15);

    return {
      fechaConsulta: hoy.toISOString().slice(0, 10),
      metricas: {
        aplicacionesActivas: appsActivasSet.size,
        totalContratos: licencias.length,
        cuposTotales,
        cuposOcupados,
        porcentajeUso,
        cuposLibres: cuposLibresTotales,
        cuposAsignables: cuposAsignablesTotales,
      },
      alertas: {
        vencimientosMenos30Dias: {
          total: contratosMenos30Dias.length,
          contratos: contratosMenos30Dias,
        },
        vencidos: {
          total: contratosVencidos.length,
          contratos: contratosVencidos,
        },
      },
      actividadReciente,
    };
  }
}
