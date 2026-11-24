import type {
  EmployeeSelectorItem,
  IEmployeeSearchReadModel,
} from '../../../domain/contracts/employeeSearch.js';
import type { SearchEmployeesSelectorQuery } from './SearchEmployeesSelectorQuery.js';

/**
 * Manejador de consulta optimizado para selector de asignación de licencias (HU03).
 */
export class SearchEmployeesSelectorQueryHandler {
  constructor(private readonly readModel: IEmployeeSearchReadModel) {}

  async handle(query: SearchEmployeesSelectorQuery): Promise<EmployeeSelectorItem[]> {
    return this.readModel.buscarParaSelector(query.criteria);
  }
}
