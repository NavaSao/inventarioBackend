import { BusinessError } from '../../../../domain/exceptions/BusinessError.js';
import type { IUserReadModel, UserSessionDTO } from '../../../../domain/contracts/index.js';
import type { GetSessionQuery } from './GetSessionQuery.js';
import type { IGetSessionHandler } from './IGetSessionHandler.js';

/**
 * Orquestador de consulta y verificación de sesión (CQRS - Query Handler).
 * Utiliza UserReadModel para lectura directa sin tocar repositorios de mutación.
 */
export class GetSessionHandler implements IGetSessionHandler {
  constructor(private readonly userReadModel: IUserReadModel) {}

  async handle(query: GetSessionQuery): Promise<UserSessionDTO> {
    const usuario = await this.userReadModel.findById(query.userId);

    if (!usuario || !usuario.activo || usuario.versionSesion !== query.sessionVersion) {
      throw new BusinessError('Sesión expirada, revocada o usuario inactivo', 401);
    }

    return {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
    };
  }
}
