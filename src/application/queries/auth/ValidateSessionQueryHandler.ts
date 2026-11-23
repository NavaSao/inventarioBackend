import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import type { ISessionQueryRepository, UserSessionDTO } from '../../../domain/contracts/index.js';
import type { ValidateSessionQuery } from './ValidateSessionQuery.js';

/**
 * Orquestador de consulta y verificación de sesión (CQRS - Query Handler).
 * Utiliza ISessionQueryRepository para lectura directa optimizada sin mutaciones.
 */
export class ValidateSessionQueryHandler {
  constructor(private readonly sessionQueryRepository: ISessionQueryRepository) {}

  async handle(query: ValidateSessionQuery): Promise<UserSessionDTO> {
    const session = await this.sessionQueryRepository.findSessionById(query.userId, query.sessionVersion);

    if (!session) {
      throw new BusinessError('Sesión expirada, revocada o usuario inactivo', 401);
    }

    return session;
  }
}

// Alias retrocompatible
export { ValidateSessionQueryHandler as GetSessionHandler };
