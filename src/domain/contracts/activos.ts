import type { EstadoActivo } from '../enums/EstadoActivo.js';
import type { Activo, ActivoDetalle, DatosActivo } from '../models/Activo.js';

export interface FiltroActivos {
  busqueda?: string;
  estado?: EstadoActivo;
}

export interface MovimientoActivo {
  idActivo: string;
  idUsuario: string;
  nota: string | null;
}

/** Escritura del catálogo de activos. */
export interface IActivoRepository {
  registrar(datos: DatosActivo): Promise<Activo>;
  editar(idActivo: string, datos: DatosActivo): Promise<Activo>;
  actualizarFoto(idActivo: string, fotoReferencia: string): Promise<void>;
}

/** Lectura (CQRS - Query) de activos. */
export interface IActivoReadModel {
  listar(filtro: FiltroActivos): Promise<Activo[]>;
  consultar(criterio: { idActivo: string } | { etiqueta: string }): Promise<ActivoDetalle | null>;
}

/**
 * Transiciones de estado atómicas. Cada método cambia el estado solo si el activo
 * sigue en el estado de origen y registra el movimiento en la misma transacción.
 */
export interface IMovimientosActivoRepository {
  asignar(movimiento: MovimientoActivo & { idEmpleado: string }): Promise<void>;
  devolver(movimiento: MovimientoActivo): Promise<void>;
  iniciarMantenimiento(movimiento: MovimientoActivo & { nota: string }): Promise<void>;
  cerrarMantenimiento(movimiento: MovimientoActivo): Promise<void>;
}

/** Almacenamiento de fotografías; devuelve la ruta pública del archivo. */
export interface IFotoStorage {
  guardar(nombre: string, contenido: Buffer): Promise<string>;
}
