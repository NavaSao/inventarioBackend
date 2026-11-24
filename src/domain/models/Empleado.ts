/**
 * Modelo de Dominio para la entidad Empleado (HU03 y HU04: Gestión de Empleados).
 */

export interface Empleado {
  idEmpleado: string;
  numeroEmpleado: string;
  nombre: string;
  correo: string;
  departamento: string | null;
  cargo: string | null;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface DatosCrearEmpleado {
  numeroEmpleado: string;
  nombre: string;
  correo: string;
  departamento: string;
  cargo: string;
}

export interface DatosEditarEmpleado {
  numeroEmpleado: string;
  nombre: string;
  correo: string;
  departamento: string;
  cargo: string;
}

export interface EmpleadoResumen extends Empleado {
  licenciasAsignadas: number;
}
