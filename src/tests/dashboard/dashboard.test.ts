import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import type { IDashboardReadModel } from '../../domain/contracts/IDashboardReadModel.js';
import type { ResumenDashboard } from '../../domain/models/Dashboard.js';
import { GetDashboardMetricsQuery } from '../../application/dashboard/queries/metricas-dashboard/GetDashboardMetricsQuery.js';
import { GetDashboardMetricsQueryHandler } from '../../application/dashboard/queries/metricas-dashboard/GetDashboardMetricsQueryHandler.js';
import { DashboardController } from '../../presentation/controllers/DashboardController.js';
import { diaDeConsulta } from '../../domain/models/Licencia.js';

class InMemoryDashboardRepository implements IDashboardReadModel {
  constructor(private readonly mockData: ResumenDashboard) {}

  async obtenerMetricas(_hoy?: Date): Promise<ResumenDashboard> {
    return this.mockData;
  }
}

describe('HU08 — Backend del Dashboard (Métricas y Actividad Reciente)', () => {
  const hoy = diaDeConsulta(new Date('2026-11-24T00:00:00Z'));

  const resumenEjemplo: ResumenDashboard = {
    fechaConsulta: '2026-11-24',
    metricas: {
      aplicacionesActivas: 3,
      totalContratos: 4,
      cuposTotales: 25,
      cuposOcupados: 10,
      porcentajeUso: 40,
      cuposLibres: 15,
      cuposAsignables: 7, // Distinción: solo 7 son asignables porque un contrato de 8 cupos libres está vencido
    },
    alertas: {
      vencimientosMenos30Dias: {
        total: 1,
        contratos: [
          {
            idLicencia: 'lic-1',
            codigoLicencia: 'FIG-2026',
            software: 'Figma',
            plan: 'Organization',
            finVigencia: '2026-12-10',
            diasParaVencer: 16,
            cuposContratados: 5,
            cuposAsignados: 3,
            cuposLibres: 2,
            cuposAsignables: 2,
          },
        ],
      },
      vencidos: {
        total: 1,
        contratos: [
          {
            idLicencia: 'lic-vencida',
            codigoLicencia: 'JET-2025',
            software: 'JetBrains',
            plan: 'All Products',
            finVigencia: '2026-11-01',
            diasParaVencer: -23,
            cuposContratados: 10,
            cuposAsignados: 2,
            cuposLibres: 8,
            cuposAsignables: 0, // En contrato vencido, cuposAsignables es 0
          },
        ],
      },
    },
    actividadReciente: [
      {
        idMovimiento: 'asig-1',
        tipo: 'ASIGNACION',
        fecha: new Date('2026-11-24T02:00:00Z'),
        software: 'Figma',
        codigoLicencia: 'FIG-2026',
        empleado: {
          idEmpleado: 'emp-1',
          nombre: 'Elena Hernandez',
          correo: 'elena@assetops.test',
          numeroEmpleado: 'EMP-001',
          departamento: 'Ingeniería',
        },
        realizadoPor: {
          idUsuario: 'usr-admin',
          nombre: 'Admin TI',
          correo: 'admin@assetops.test',
        },
        nota: 'Asignación para proyecto sprint 2',
      },
      {
        idMovimiento: 'lib-1',
        tipo: 'LIBERACION',
        fecha: new Date('2026-11-23T18:00:00Z'),
        software: 'JetBrains',
        codigoLicencia: 'JET-2025',
        empleado: {
          idEmpleado: 'emp-2',
          nombre: 'Hugo Romero',
          correo: 'hugo@assetops.test',
          numeroEmpleado: 'EMP-002',
          departamento: 'Backend',
        },
        realizadoPor: {
          idUsuario: 'usr-admin',
          nombre: 'Admin TI',
          correo: 'admin@assetops.test',
        },
        nota: 'Liberación por cambio de rol',
      },
    ],
  };

  describe('GetDashboardMetricsQueryHandler', () => {
    it('obtiene métricas consolidadas delegando al ReadModel', async () => {
      const repo = new InMemoryDashboardRepository(resumenEjemplo);
      const handler = new GetDashboardMetricsQueryHandler(repo);

      const resultado = await handler.handle(new GetDashboardMetricsQuery(hoy));

      expect(resultado).toBeDefined();
      expect(resultado.metricas.totalContratos).toBe(4);
      expect(resultado.metricas.aplicacionesActivas).toBe(3);
      expect(resultado.metricas.cuposTotales).toBe(25);
      expect(resultado.metricas.cuposOcupados).toBe(10);
      expect(resultado.metricas.porcentajeUso).toBe(40);
    });

    it('distingue correctamente los cupos libres de los cupos asignables', async () => {
      const repo = new InMemoryDashboardRepository(resumenEjemplo);
      const handler = new GetDashboardMetricsQueryHandler(repo);

      const resultado = await handler.handle();

      // Cupos libres totales: 15 (cupos totales 25 - ocupados 10)
      expect(resultado.metricas.cuposLibres).toBe(15);
      // Cupos asignables reales: 7 (porque los 8 libres del contrato vencido no son asignables)
      expect(resultado.metricas.cuposAsignables).toBe(7);
      expect(resultado.metricas.cuposAsignables).toBeLessThan(resultado.metricas.cuposLibres);
    });

    it('clasifica las alertas de vencimientos a menos de 30 días y vencidos', async () => {
      const repo = new InMemoryDashboardRepository(resumenEjemplo);
      const handler = new GetDashboardMetricsQueryHandler(repo);

      const resultado = await handler.handle();

      expect(resultado.alertas.vencimientosMenos30Dias.total).toBe(1);
      expect(resultado.alertas.vencimientosMenos30Dias.contratos[0].codigoLicencia).toBe('FIG-2026');
      expect(resultado.alertas.vencidos.total).toBe(1);
      expect(resultado.alertas.vencidos.contratos[0].codigoLicencia).toBe('JET-2025');
      expect(resultado.alertas.vencidos.contratos[0].cuposAsignables).toBe(0);
    });

    it('devuelve la actividad reciente con movimientos de asignación y liberación', async () => {
      const repo = new InMemoryDashboardRepository(resumenEjemplo);
      const handler = new GetDashboardMetricsQueryHandler(repo);

      const resultado = await handler.handle();

      expect(resultado.actividadReciente).toHaveLength(2);

      const [asig, lib] = resultado.actividadReciente;
      expect(asig.tipo).toBe('ASIGNACION');
      expect(asig.software).toBe('Figma');
      expect(asig.empleado.nombre).toBe('Elena Hernandez');
      expect(asig.realizadoPor.nombre).toBe('Admin TI');

      expect(lib.tipo).toBe('LIBERACION');
      expect(lib.software).toBe('JetBrains');
      expect(lib.empleado.nombre).toBe('Hugo Romero');
    });
  });

  describe('DashboardController', () => {
    function crearRespuestaMock(): Response {
      const res = {} as Partial<Response>;
      res.status = jest.fn<any>().mockReturnValue(res);
      res.json = jest.fn<any>().mockReturnValue(res);
      return res as Response;
    }

    it('responde HTTP 200 con la respuesta estructurada de ResponseBuilder', async () => {
      const repo = new InMemoryDashboardRepository(resumenEjemplo);
      const handler = new GetDashboardMetricsQueryHandler(repo);
      const controller = new DashboardController(handler);

      const req = {} as Request;
      const res = crearRespuestaMock();
      const next = jest.fn();

      await controller.execute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Métricas del dashboard consultadas exitosamente',
          data: expect.objectContaining({
            metricas: expect.objectContaining({
              aplicacionesActivas: 3,
              cuposTotales: 25,
            }),
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('envía los errores al middleware centralizado a través de next(error)', async () => {
      const handlerFallido = {
        handle: jest.fn<(...args: any[]) => Promise<any>>().mockRejectedValue(new Error('Fallo de base de datos')),
      };
      const controller = new DashboardController(handlerFallido as any);

      const req = {} as Request;
      const res = crearRespuestaMock();
      const next = jest.fn();

      await controller.execute(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
