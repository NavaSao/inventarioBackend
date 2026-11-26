import { EstadoActivo } from '../enums/EstadoActivo.js';
import { BusinessError } from '../exceptions/BusinessError.js';

export interface DatosActivo {
  nombre: string;
  numeroSerie: string;
  etiqueta: string;
  categoria: string;
  ubicacion: string;
  marca: string | null;
  modelo: string | null;
}

export interface Activo extends DatosActivo {
  idActivo: string;
  estado: EstadoActivo;
  fotoReferencia: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

/** Ficha del activo con su asignación y mantenimiento abiertos (si existen). */
export interface ActivoDetalle extends Activo {
  asignacionActual: {
    entregadoEn: Date;
    empleado: { idEmpleado: string; numeroEmpleado: string; nombre: string; departamento: string | null };
  } | null;
  mantenimientoActual: { iniciadoEn: Date; notaInicial: string } | null;
}

export type AccionActivo = 'ASIGNAR' | 'DEVOLVER' | 'INICIAR_MANTENIMIENTO' | 'CERRAR_MANTENIMIENTO';

/** Máquina de estados del activo: cada acción solo es válida desde un estado. */
export const TRANSICIONES: Record<AccionActivo, { desde: EstadoActivo; hacia: EstadoActivo; error: string }> = {
  ASIGNAR: {
    desde: EstadoActivo.DISPONIBLE,
    hacia: EstadoActivo.ASIGNADO,
    error: 'Solo se puede asignar un activo disponible',
  },
  DEVOLVER: {
    desde: EstadoActivo.ASIGNADO,
    hacia: EstadoActivo.DISPONIBLE,
    error: 'El activo no tiene una asignación abierta',
  },
  INICIAR_MANTENIMIENTO: {
    desde: EstadoActivo.DISPONIBLE,
    hacia: EstadoActivo.EN_MANTENIMIENTO,
    error: 'Solo un activo disponible puede enviarse a mantenimiento; registra antes su devolución',
  },
  CERRAR_MANTENIMIENTO: {
    desde: EstadoActivo.EN_MANTENIMIENTO,
    hacia: EstadoActivo.DISPONIBLE,
    error: 'El activo no está en mantenimiento',
  },
};

export function validarTransicion(estado: EstadoActivo, accion: AccionActivo): void {
  if (accion === 'ASIGNAR' && estado === EstadoActivo.EN_MANTENIMIENTO) {
    throw new BusinessError('El activo está en mantenimiento y no puede asignarse', 409);
  }
  if (TRANSICIONES[accion].desde !== estado) {
    throw new BusinessError(TRANSICIONES[accion].error, 409);
  }
}
