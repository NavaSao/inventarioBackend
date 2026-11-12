import type { IQueryHandler } from '../../core/cqrs/query.interface.js';
import type { IUsuarioReadRepository } from '../../core/interfaces/usuarioRepository.interface.js';
import { ObtenerSesionQuery } from './obtenerSesion.query.js';
import type { DatosSesion } from './sesion.dto.js';

export class ObtenerSesionHandler implements IQueryHandler<ObtenerSesionQuery, DatosSesion | null> {
  readonly tipoQuery = ObtenerSesionQuery.tipo;

  constructor(private readonly usuarioRepository: IUsuarioReadRepository) {}

  async ejecutar(consulta: ObtenerSesionQuery): Promise<DatosSesion | null> {
    const usuario = await this.usuarioRepository.buscarPorId(consulta.idUsuario);

    // Verificamos existencia, estado activo y que la versión de sesión coincida
    if (!usuario || !usuario.activo || usuario.versionSesion !== consulta.versionSesion) {
      return null;
    }

    return {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
    };
  }
}
