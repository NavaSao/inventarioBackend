import { describe, expect, it, beforeEach } from '@jest/globals';
import type { Request, Response } from 'express';
import type {
  EmployeeFilterCriteria,
  EmployeeSelectorCriteria,
  EmployeeSelectorItem,
  IEmployeeSearchReadModel,
} from '../../domain/contracts/employeeSearch.js';
import type { EmpleadoResumen } from '../../domain/models/Empleado.js';
import { SearchEmployeesQuery } from '../../application/queries/empleados/SearchEmployeesQuery.js';
import { SearchEmployeesQueryHandler } from '../../application/queries/empleados/SearchEmployeesQueryHandler.js';
import { SearchEmployeesSelectorQuery } from '../../application/queries/empleados/SearchEmployeesSelectorQuery.js';
import { SearchEmployeesSelectorQueryHandler } from '../../application/queries/empleados/SearchEmployeesSelectorQueryHandler.js';
import { SearchEmployeesController } from '../../presentation/controllers/SearchEmployeesController.js';
import { SearchEmployeesSelectorController } from '../../presentation/controllers/SearchEmployeesSelectorController.js';

class InMemoryEmployeeSearchRepository implements IEmployeeSearchReadModel {
  public empleados: EmpleadoResumen[] = [];

  async buscar(criterios: EmployeeFilterCriteria): Promise<EmpleadoResumen[]> {
    return this.empleados.filter((emp) => {
      // Filtro por estado activo
      if (criterios.activo !== undefined && emp.activo !== criterios.activo) {
        return false;
      }

      // Filtro por departamento o área
      const depFiltro = criterios.departamento || criterios.area;
      if (depFiltro) {
        const matchesDep = emp.departamento?.toLowerCase().includes(depFiltro.toLowerCase());
        if (!matchesDep) return false;
      }

      // Búsqueda por texto (nombre, área o cargo)
      if (criterios.busqueda && criterios.busqueda.trim() !== '') {
        const termino = criterios.busqueda.trim().toLowerCase();
        const matchesNombre = emp.nombre.toLowerCase().includes(termino);
        const matchesDep = emp.departamento?.toLowerCase().includes(termino);
        const matchesCargo = emp.cargo?.toLowerCase().includes(termino);

        if (!matchesNombre && !matchesDep && !matchesCargo) {
          return false;
        }
      }

      return true;
    });
  }

  async buscarParaSelector(criterios: EmployeeSelectorCriteria): Promise<EmployeeSelectorItem[]> {
    let filtrados = this.empleados.filter((emp) => {
      if (criterios.soloActivos !== false && !emp.activo) {
        return false;
      }

      if (criterios.busqueda && criterios.busqueda.trim() !== '') {
        const termino = criterios.busqueda.trim().toLowerCase();
        const matchesNombre = emp.nombre.toLowerCase().includes(termino);
        const matchesCorreo = emp.correo.toLowerCase().includes(termino);
        if (!matchesNombre && !matchesCorreo) return false;
      }

      return true;
    });

    if (criterios.limite) {
      filtrados = filtrados.slice(0, criterios.limite);
    }

    return filtrados.map((e) => ({
      idEmpleado: e.idEmpleado,
      numeroEmpleado: e.numeroEmpleado,
      nombre: e.nombre,
      correo: e.correo,
      departamento: e.departamento,
      cargo: e.cargo,
      activo: e.activo,
    }));
  }
}

describe('HU03: Búsqueda y Filtrado de Empleados (CQRS + SOLID)', () => {
  let repository: InMemoryEmployeeSearchRepository;
  let searchQueryHandler: SearchEmployeesQueryHandler;
  let selectorQueryHandler: SearchEmployeesSelectorQueryHandler;

  const empleadosPrueba: EmpleadoResumen[] = [
    {
      idEmpleado: '11111111-1111-1111-1111-111111111111',
      numeroEmpleado: 'EMP-001',
      nombre: 'Carlos Mendoza',
      correo: 'carlos.mendoza@assetops.test',
      departamento: 'Tecnología',
      cargo: 'Líder Técnico',
      activo: true,
      creadoEn: new Date('2026-01-10'),
      actualizadoEn: new Date('2026-01-10'),
      licenciasAsignadas: 2,
    },
    {
      idEmpleado: '22222222-2222-2222-2222-222222222222',
      numeroEmpleado: 'EMP-002',
      nombre: 'Lucía Fernández',
      correo: 'lucia.fernandez@assetops.test',
      departamento: 'Tecnología',
      cargo: 'Desarrolladora Frontend',
      activo: true,
      creadoEn: new Date('2026-02-15'),
      actualizadoEn: new Date('2026-02-15'),
      licenciasAsignadas: 1,
    },
    {
      idEmpleado: '33333333-3333-3333-3333-333333333333',
      numeroEmpleado: 'EMP-003',
      nombre: 'Mariana Silva',
      correo: 'mariana.silva@assetops.test',
      departamento: 'Recursos Humanos',
      cargo: 'Coordinadora de Talento',
      activo: false,
      creadoEn: new Date('2026-03-01'),
      actualizadoEn: new Date('2026-03-01'),
      licenciasAsignadas: 0,
    },
    {
      idEmpleado: '44444444-4444-4444-4444-444444444444',
      numeroEmpleado: 'EMP-004',
      nombre: 'Fernando Torres',
      correo: 'fernando.torres@assetops.test',
      departamento: 'Finanzas',
      cargo: 'Analista Financiero',
      activo: true,
      creadoEn: new Date('2026-04-12'),
      actualizadoEn: new Date('2026-04-12'),
      licenciasAsignadas: 0,
    },
  ];

  beforeEach(() => {
    repository = new InMemoryEmployeeSearchRepository();
    repository.empleados = [...empleadosPrueba];
    searchQueryHandler = new SearchEmployeesQueryHandler(repository);
    selectorQueryHandler = new SearchEmployeesSelectorQueryHandler(repository);
  });

  describe('1. Búsqueda y Filtros Combinados (SearchEmployeesQueryHandler)', () => {
    it('debe buscar empleados por coincidencia en el nombre', async () => {
      const query = new SearchEmployeesQuery({ busqueda: 'Carlos' });
      const resultado = await searchQueryHandler.handle(query);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombre).toBe('Carlos Mendoza');
    });

    it('debe buscar empleados por área / departamento', async () => {
      const query = new SearchEmployeesQuery({ busqueda: 'Tecnología' });
      const resultado = await searchQueryHandler.handle(query);

      expect(resultado).toHaveLength(2);
      expect(resultado.map((e) => e.nombre)).toEqual(
        expect.arrayContaining(['Carlos Mendoza', 'Lucía Fernández']),
      );
    });

    it('debe filtrar combinando departamento y estado activo', async () => {
      // Departamento: Recursos Humanos y activo: false
      const queryInactivo = new SearchEmployeesQuery({
        departamento: 'Recursos Humanos',
        activo: false,
      });
      const resInactivo = await searchQueryHandler.handle(queryInactivo);
      expect(resInactivo).toHaveLength(1);
      expect(resInactivo[0].nombre).toBe('Mariana Silva');

      // Departamento: Recursos Humanos y activo: true (debe retornar 0)
      const queryActivo = new SearchEmployeesQuery({
        departamento: 'Recursos Humanos',
        activo: true,
      });
      const resActivo = await searchQueryHandler.handle(queryActivo);
      expect(resActivo).toHaveLength(0);
    });

    it('debe retornar todos los empleados si los filtros están vacíos', async () => {
      const query = new SearchEmployeesQuery({});
      const resultado = await searchQueryHandler.handle(query);
      expect(resultado).toHaveLength(4);
    });
  });

  describe('2. Selector Rápido para Asignación de Licencias (SearchEmployeesSelectorQueryHandler)', () => {
    it('debe buscar en el selector por coincidencia de nombre o correo electrónico', async () => {
      // Por nombre
      const queryPorNombre = new SearchEmployeesSelectorQuery({ busqueda: 'Lucía' });
      const resNombre = await selectorQueryHandler.handle(queryPorNombre);
      expect(resNombre).toHaveLength(1);
      expect(resNombre[0].correo).toBe('lucia.fernandez@assetops.test');

      // Por correo
      const queryPorCorreo = new SearchEmployeesSelectorQuery({ busqueda: 'carlos.mendoza' });
      const resCorreo = await selectorQueryHandler.handle(queryPorCorreo);
      expect(resCorreo).toHaveLength(1);
      expect(resCorreo[0].nombre).toBe('Carlos Mendoza');
    });

    it('por defecto debe excluir empleados inactivos del selector de asignación', async () => {
      const query = new SearchEmployeesSelectorQuery({});
      const resultado = await selectorQueryHandler.handle(query);

      expect(resultado.every((e) => e.activo)).toBe(true);
      expect(resultado.find((e) => e.nombre === 'Mariana Silva')).toBeUndefined();
      expect(resultado).toHaveLength(3);
    });

    it('debe respetar el límite de resultados especificado en el selector', async () => {
      const query = new SearchEmployeesSelectorQuery({ limite: 2 });
      const resultado = await selectorQueryHandler.handle(query);
      expect(resultado).toHaveLength(2);
    });
  });

  describe('3. Single Action Controllers de Presentación', () => {
    it('SearchEmployeesController debe invocar el handler y responder HTTP 200 con éxito', async () => {
      const controller = new SearchEmployeesController(searchQueryHandler);
      const req = {
        query: { busqueda: 'Lucía', activo: 'true' },
      } as unknown as Request;

      let statusCode = 0;
      let jsonBody: any = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (body: any) => {
          jsonBody = body;
          return res;
        },
      } as unknown as Response;

      let nextCalledWith: any = null;
      const next = (err?: any) => {
        nextCalledWith = err;
      };

      await controller.execute(req, res, next);

      expect(nextCalledWith).toBeNull();
      expect(statusCode).toBe(200);
      expect(jsonBody.status).toBe('success');
      expect(jsonBody.data).toHaveLength(1);
      expect(jsonBody.data[0].nombre).toBe('Lucía Fernández');
    });

    it('SearchEmployeesSelectorController debe procesar los query params y responder HTTP 200', async () => {
      const controller = new SearchEmployeesSelectorController(selectorQueryHandler);
      const req = {
        query: { q: 'fernando' },
      } as unknown as Request;

      let statusCode = 0;
      let jsonBody: any = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (body: any) => {
          jsonBody = body;
          return res;
        },
      } as unknown as Response;

      const next = () => {};

      await controller.execute(req, res, next);

      expect(statusCode).toBe(200);
      expect(jsonBody.status).toBe('success');
      expect(jsonBody.data).toHaveLength(1);
      expect(jsonBody.data[0].nombre).toBe('Fernando Torres');
    });
  });
});
