import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../contracts/tokenService.interface.js';
import { configuracionJwt, validarSecretoJwt } from '../config/jwt.js';

export class JwtTokenService implements ITokenService {
  private readonly secreto: string;

  constructor(config: { secreto: string }) {
    this.secreto = validarSecretoJwt(config.secreto);
  }

  firmarToken(idUsuario: string, versionSesion: number): string {
    return jwt.sign({ versionSesion }, this.secreto, {
      algorithm: configuracionJwt.algoritmo,
      subject: idUsuario,
      expiresIn: configuracionJwt.expiracion,
    });
  }

  verificarToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secreto, { algorithms: [configuracionJwt.algoritmo] });
      if (typeof decoded === 'object' && typeof decoded.sub === 'string'
          && typeof decoded.versionSesion === 'number') {
        return { sub: decoded.sub, versionSesion: decoded.versionSesion };
      }
      return null;
    } catch {
      return null;
    }
  }
}
