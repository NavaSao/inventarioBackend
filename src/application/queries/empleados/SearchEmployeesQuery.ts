import type { EmployeeFilterCriteria } from '../../../domain/contracts/employeeSearch.js';

/**
 * Query para búsqueda y filtrado combinado de empleados (HU03 - CQRS).
 */
export class SearchEmployeesQuery {
  constructor(public readonly criteria: EmployeeFilterCriteria) {}
}
