import type { Request, Response, NextFunction } from 'express';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import type { ITokenService } from '../../domain/contracts/index.js';

export interface AuthenticatedUser {
  idUsuario: string;
  versionSesion: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * AuthGuard desacoplado para proteger rutas privadas mediante Bearer JWT.
 * Cumple SOLID (DIP: depende de la abstracción ITokenService).
 */
export class AuthGuard {
  constructor(private readonly tokenService: ITokenService) {}

  public handle = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BusinessError('Acceso no autorizado: Token requerido', 401);
    }

    const token = authHeader.slice(7).trim();
    const payload = this.tokenService.verifyToken(token);

    if (!payload) {
      throw new BusinessError('Acceso no autorizado: Token inválido o expirado', 401);
    }

    req.user = {
      idUsuario: payload.sub,
      versionSesion: payload.versionSesion,
    };

    next();
  };
}

/**
 * Helper factory para compatibilidad funcional con middlewares de Express
 */
export const createAuthMiddleware = (tokenService: ITokenService) => {
  const guard = new AuthGuard(tokenService);
  return guard.handle;
};
