import type { IEmpleadoReadModel } from '../../../domain/contracts/empleados.js';
import type { EmpleadoResumen } from '../../../domain/models/Empleado.js';

export class ListarEmpleadosHandler {
  constructor(private readonly readModel: IEmpleadoReadModel) {}

  async handle(): Promise<EmpleadoResumen[]> {
    return this.readModel.listar();
  }
}
