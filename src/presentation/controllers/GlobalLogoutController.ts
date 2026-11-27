import type { Request, Response, NextFunction } from 'express';
import { GlobalLogoutCommand } from '../../application/auth/commands/global-logout/GlobalLogoutCommand.js';
import type { GlobalLogoutCommandHandler } from '../../application/auth/commands/global-logout/GlobalLogoutCommandHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';

/**
 * Single Action Controller para Cierre de Sesión Global (POST /api/auth/logout-global).
 * Cumple SRP: una única función pública para revocar todos los tokens emitidos previamente.
 */
export class GlobalLogoutController {
  constructor(private readonly globalLogoutCommandHandler: GlobalLogoutCommandHandler) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.idUsuario) {
        throw new BusinessError('Usuario no autenticado para realizar cierre de sesión', 401);
      }

      const command = new GlobalLogoutCommand(req.user.idUsuario);
      const result = await this.globalLogoutCommandHandler.handle(command);

      ResponseBuilder.success(res, result, 'Cierre de sesión global realizado exitosamente');
    } catch (error) {
      next(error);
    }
  };
}
