import type { EmpleadoResumen } from '../models/Empleado.js';

/**
 * Contrato de consulta para lectura optimizada de Empleados (CQRS).
 */
export interface IEmpleadoReadModel {
  listar(): Promise<EmpleadoResumen[]>;
  consultar(idEmpleado: string): Promise<EmpleadoResumen | null>;
}
