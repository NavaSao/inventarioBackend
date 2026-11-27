import type { DatosEditarEmpleado } from '../../../../domain/models/Empleado.js';

export interface EditarEmpleadoCommand extends DatosEditarEmpleado {
  idEmpleado: string;
}
