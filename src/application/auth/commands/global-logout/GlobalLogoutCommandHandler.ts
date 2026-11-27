import type { ISessionInvalidationRepository } from '../../../../domain/contracts/index.js';
import type { GlobalLogoutCommand } from './GlobalLogoutCommand.js';
import { BusinessError } from '../../../../domain/exceptions/BusinessError.js';
import type { GlobalLogoutResult } from './GlobalLogoutResult.js';

/**
 * Orquestador del Cierre de Sesión Global (CQRS - Command Handler / HU02).
 * Incrementa atómicamente la versión de sesión del usuario en la base de datos,
 * invalidando instantáneamente todos los JWT emitidos previamente.
 */
export class GlobalLogoutCommandHandler {
  constructor(
    private readonly sessionInvalidationRepository: ISessionInvalidationRepository,
  ) {}

  async handle(command: GlobalLogoutCommand): Promise<GlobalLogoutResult> {
    if (!command.userId) {
      throw new BusinessError('Identificador de usuario inválido', 400);
    }

    await this.sessionInvalidationRepository.incrementSessionVersion(command.userId);

    return {
      success: true,
      message: 'Todas las sesiones activas han sido cerradas exitosamente',
    };
  }
}
