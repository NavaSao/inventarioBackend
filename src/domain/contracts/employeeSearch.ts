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

export type { IEmployeeSearchReadModel } from './IEmployeeSearchReadModel.js';
