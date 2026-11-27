import type { RequestHandler } from 'express';
import { ValidateSessionQuery } from '../../application/auth/queries/validate-session/ValidateSessionQuery.js';
import type { ValidateSessionQueryHandler } from '../../application/auth/queries/validate-session/ValidateSessionQueryHandler.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';

// Después de verificar el JWT, confirmo que la cuenta siga activa y el token no se haya revocado.
export function crearGuardiaSesionActiva(
  consultarSesion: Pick<ValidateSessionQueryHandler, 'handle'>,
): RequestHandler {
  return async (req, _res, next): Promise<void> => {
    if (!req.user) throw new BusinessError('Acceso no autorizado', 401);

    await consultarSesion.handle(new ValidateSessionQuery(req.user.idUsuario, req.user.versionSesion));
    next();
  };
}
