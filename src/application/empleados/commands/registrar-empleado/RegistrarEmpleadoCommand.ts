import type { DatosCrearEmpleado } from '../../../../domain/models/Empleado.js';

export interface RegistrarEmpleadoCommand extends DatosCrearEmpleado {
  enviarCorreoBienvenida?: boolean;
}
