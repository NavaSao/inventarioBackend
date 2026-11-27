import { parametrosEmpleadoSchema, validarEmpleado } from '../../validacionEmpleado.js';

export function validarDesactivacionEmpleado(datos: unknown) {
  return validarEmpleado(parametrosEmpleadoSchema, datos);
}
