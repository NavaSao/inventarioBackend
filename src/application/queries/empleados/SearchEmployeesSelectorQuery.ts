import type { EmployeeSelectorCriteria } from '../../../domain/contracts/employeeSearch.js';

/**
 * Query optimizada para el selector rápido de asignación de licencias (HU03 - CQRS).
 */
export class SearchEmployeesSelectorQuery {
  constructor(public readonly criteria: EmployeeSelectorCriteria) {}
}
