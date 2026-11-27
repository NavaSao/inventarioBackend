import type { Request, Response, NextFunction } from 'express';
import { ValidateSessionQuery } from '../../application/auth/queries/validate-session/ValidateSessionQuery.js';
import type { ValidateSessionQueryHandler } from '../../application/auth/queries/validate-session/ValidateSessionQueryHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';

/**
 * Single Action Controller para Validación de Sesión Activa (GET /api/auth/sesion).
 * Cumple SRP: una única función pública para consultar la sesión activa.
 */
export class ValidateSessionController {
  constructor(private readonly validateSessionQueryHandler: ValidateSessionQueryHandler) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BusinessError('Usuario no autenticado en la solicitud', 401);
      }

      const query = new ValidateSessionQuery(req.user.idUsuario, req.user.versionSesion);
      const session = await this.validateSessionQueryHandler.handle(query);

      ResponseBuilder.success(res, session, 'Sesión activa verificada');
    } catch (error) {
      next(error);
    }
  };
}
