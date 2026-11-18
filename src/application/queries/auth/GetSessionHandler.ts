import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import type { IUserReadModel, UserSessionDTO } from '../../../domain/contracts/index.js';
import type { GetSessionQuery } from './GetSessionQuery.js';

/**
 * Orquestador de consulta y verificación de sesión (CQRS - Query Handler).
 * Utiliza UserReadModel para lectura directa sin tocar repositorios de mutación.
 */
export class GetSessionHandler {
  constructor(private readonly userReadModel: IUserReadModel) {}

  async handle(query: GetSessionQuery): Promise<UserSessionDTO> {
    const session = await this.userReadModel.findSessionById(query.userId, query.sessionVersion);

    if (!session) {
      throw new BusinessError('Sesión expirada, revocada o usuario inactivo', 401);
    }

    return session;
  }
}
