import type { IEmployeeSearchReadModel } from '../../../../domain/contracts/employeeSearch.js';
import type { EmpleadoResumen } from '../../../../domain/models/Empleado.js';
import type { SearchEmployeesQuery } from './SearchEmployeesQuery.js';

/**
 * Manejador de consulta para listado con filtros de empleados (HU03).
 * CQRS estricto: cero mutaciones de estado, solo lectura optimizada.
 */
export class SearchEmployeesQueryHandler {
  constructor(private readonly readModel: IEmployeeSearchReadModel) {}

  async handle(query: SearchEmployeesQuery): Promise<EmpleadoResumen[]> {
    return this.readModel.buscar(query.criteria);
  }
}
