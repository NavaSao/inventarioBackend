import type {
  EmployeeFilterCriteria,
  EmployeeSelectorCriteria,
  EmployeeSelectorItem,
  IEmployeeSearchReadModel,
} from '../../domain/contracts/employeeSearch.js';
import type { EmpleadoResumen } from '../../domain/models/Empleado.js';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../config/database.js';

/**
 * Adaptador de lectura para Empleados (HU03 - CQRS).
 * Optimiza búsquedas textuales y filtrado combinable con índices de PostgreSQL.
 */
export class PrismaEmployeeSearchRepository implements IEmployeeSearchReadModel {
  constructor(private readonly client = prisma) {}

  async buscar(criterios: EmployeeFilterCriteria): Promise<EmpleadoResumen[]> {
    const where: Prisma.EmpleadoWhereInput = {};

    // 1. Filtro por estado activo (si se especifica)
    if (criterios.activo !== undefined) {
      where.activo = criterios.activo;
    }

    // 2. Filtro por departamento o área
    const depFiltro = criterios.departamento || criterios.area;
    if (depFiltro) {
      where.departamento = {
        contains: depFiltro.trim(),
        mode: 'insensitive',
      };
    }

    // 3. Búsqueda por texto (nombre, área o cargo)
    if (criterios.busqueda && criterios.busqueda.trim() !== '') {
      const termino = criterios.busqueda.trim();
      where.OR = [
        { nombre: { contains: termino, mode: 'insensitive' } },
        { departamento: { contains: termino, mode: 'insensitive' } },
        { cargo: { contains: termino, mode: 'insensitive' } },
      ];
    }

    const filas = await this.client.empleado.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      include: {
        _count: {
          select: {
            asignacionesLicencias: {
              where: { liberadoEn: null },
            },
          },
        },
      },
    });

    return filas.map((fila) => ({
      idEmpleado: fila.idEmpleado,
      numeroEmpleado: fila.numeroEmpleado,
      nombre: fila.nombre,
      correo: fila.correo,
      departamento: fila.departamento,
      cargo: fila.cargo,
      activo: fila.activo,
      creadoEn: fila.creadoEn,
      actualizadoEn: fila.actualizadoEn,
      licenciasAsignadas: fila._count.asignacionesLicencias,
    }));
  }

  async buscarParaSelector(criterios: EmployeeSelectorCriteria): Promise<EmployeeSelectorItem[]> {
    const where: Prisma.EmpleadoWhereInput = {};

    // En el selector, por defecto se filtran los empleados activos
    if (criterios.soloActivos !== false) {
      where.activo = true;
    }

    if (criterios.busqueda && criterios.busqueda.trim() !== '') {
      const termino = criterios.busqueda.trim();
      where.OR = [
        { nombre: { contains: termino, mode: 'insensitive' } },
        { correo: { contains: termino, mode: 'insensitive' } },
      ];
    }

    const filas = await this.client.empleado.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: criterios.limite ?? 50,
      select: {
        idEmpleado: true,
        numeroEmpleado: true,
        nombre: true,
        correo: true,
        departamento: true,
        cargo: true,
        activo: true,
      },
    });

    return filas;
  }
}
