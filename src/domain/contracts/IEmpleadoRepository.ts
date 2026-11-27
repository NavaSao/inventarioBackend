import type { DatosCrearEmpleado, DatosEditarEmpleado, Empleado } from '../models/Empleado.js';

/**
 * Contrato de persistencia para operaciones de comando (escritura) y búsqueda de Empleados.
 */
export interface IEmpleadoRepository {
  crear(datos: DatosCrearEmpleado): Promise<Empleado>;
  editar(idEmpleado: string, datos: DatosEditarEmpleado): Promise<Empleado>;
  desactivar(idEmpleado: string): Promise<Empleado>;
  buscarPorId(idEmpleado: string): Promise<Empleado | null>;
  buscarPorCorreo(correo: string): Promise<Empleado | null>;
  buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Empleado | null>;
  contarLicenciasActivas(idEmpleado: string): Promise<number>;
}
