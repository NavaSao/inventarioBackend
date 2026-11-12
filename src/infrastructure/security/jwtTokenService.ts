import jwt, { type Algorithm } from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../../core/interfaces/tokenService.interface.js';

export interface JwtConfig {
  secreto: string;
  algoritmo?: Algorithm;
  expiracion?: string;
}

export class JwtTokenService implements ITokenService {
  private readonly secreto: string;
  private readonly algoritmo: Algorithm;
  private readonly expiracion: string;

  constructor(config: JwtConfig) {
    const secretoLimpio = config.secreto?.trim();
    if (!secretoLimpio || Buffer.byteLength(secretoLimpio, 'utf8') < 32) {
      throw new Error('Configura JWT_SECRET con al menos 32 bytes en .env.');
    }
    this.secreto = secretoLimpio;
    this.algoritmo = config.algoritmo ?? 'HS256';
    this.expiracion = config.expiracion ?? '1h';
  }

  firmarToken(idUsuario: string, versionSesion: number): string {
    return jwt.sign({ versionSesion }, this.secreto, {
      algorithm: this.algoritmo,
      subject: idUsuario,
      expiresIn: this.expiracion as jwt.SignOptions['expiresIn'],
    });
  }

  verificarToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secreto, {
        algorithms: [this.algoritmo],
      });
      if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded && 'versionSesion' in decoded) {
        return decoded as unknown as TokenPayload;
      }
      return null;
    } catch {
      return null;
    }
  }
}
