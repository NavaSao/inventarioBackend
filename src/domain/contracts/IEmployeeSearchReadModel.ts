import type { EmployeeFilterCriteria, EmployeeSelectorCriteria, EmployeeSelectorItem } from './employeeSearch.js';
import type { EmpleadoResumen } from '../models/Empleado.js';

/**
 * Modelo de lectura segregado (ISP) exclusivo para consultas y filtros de empleados (CQRS - Query).
 */
export interface IEmployeeSearchReadModel {
  buscar(criterios: EmployeeFilterCriteria): Promise<EmpleadoResumen[]>;
  buscarParaSelector(criterios: EmployeeSelectorCriteria): Promise<EmployeeSelectorItem[]>;
}
