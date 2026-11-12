import { ObtenerSesionQuery } from './obtenerSesion.query.js';
import { ObtenerSesionHandler } from './obtenerSesion.handler.js';
import type { DatosSesion } from './sesion.dto.js';
import { obtenerContenedor } from '../../container.js';

export { ObtenerSesionQuery, ObtenerSesionHandler, type DatosSesion };

/**
 * Función facade para compatibilidad directa que ejecuta la consulta a través del QueryBus.
 */
export async function obtenerSesion(idUsuario: string, versionSesion: number): Promise<DatosSesion | null> {
  const { queryBus } = obtenerContenedor();
  return queryBus.consultar<DatosSesion | null>(new ObtenerSesionQuery(idUsuario, versionSesion));
}
