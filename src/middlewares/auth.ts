import type { RequestHandler } from 'express';
import type { ITokenService, TokenPayload } from '../contracts/tokenService.interface.js';
import { BusinessError } from '../exceptions/BusinessError.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}

export function crearMiddlewareAuth(tokenService: ITokenService): RequestHandler {
  return (req, _res, next) => {
    const encabezado = req.headers.authorization;
    const token = encabezado?.startsWith('Bearer ') ? encabezado.slice(7) : null;
    if (!token) {
      next(new BusinessError(401, 'Acceso no autorizado'));
      return;
    }

    const usuario = tokenService.verificarToken(token);
    if (!usuario) {
      next(new BusinessError(401, 'Sesión inválida o expirada'));
      return;
    }

    // La consulta de sesión comprobará la cuenta y su versión en PostgreSQL.
    req.user = usuario;
    next();
  };
}
