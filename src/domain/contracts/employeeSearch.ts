import type { EmpleadoResumen } from '../models/Empleado.js';

/**
 * Criterios de filtrado combinable para empleados (HU03).
 */
export interface EmployeeFilterCriteria {
  busqueda?: string;
  departamento?: string;
  area?: string;
  activo?: boolean;
}

/**
 * Criterios para el selector rápido de asignación de licencias (HU03).
 */
export interface EmployeeSelectorCriteria {
  busqueda?: string;
  soloActivos?: boolean;
  limite?: number;
}

/**
 * DTO optimizado para selector en aplicaciones móviles o frontends.
 */
export interface EmployeeSelectorItem {
  idEmpleado: string;
  numeroEmpleado: string;
  nombre: string;
  correo: string;
  departamento: string | null;
  cargo: string | null;
  activo: boolean;
}

/**
 * Modelo de lectura segregado (ISP) exclusivo para consultas y filtros de empleados (CQRS - Query).
 */
export interface IEmployeeSearchReadModel {
  buscar(criterios: EmployeeFilterCriteria): Promise<EmpleadoResumen[]>;
  buscarParaSelector(criterios: EmployeeSelectorCriteria): Promise<EmployeeSelectorItem[]>;
}
