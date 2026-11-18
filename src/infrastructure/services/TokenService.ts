import jwt, { type SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import type { ITokenService } from '../../domain/contracts/index.js';

export class TokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: SignOptions['expiresIn'];
  private readonly algorithm: SignOptions['algorithm'];

  constructor(customSecret?: string) {
    this.secret = customSecret || jwtConfig.secret;
    this.expiresIn = jwtConfig.expiresIn;
    this.algorithm = jwtConfig.algorithm;
  }

  generateToken(idUsuario: string, versionSesion: number): string {
    return jwt.sign({ versionSesion }, this.secret, {
      algorithm: this.algorithm,
      subject: idUsuario,
      expiresIn: this.expiresIn,
    });
  }

  verifyToken(token: string): { sub: string; versionSesion: number } | null {
    try {
      return jwt.verify(token, this.secret) as {
        sub: string;
        versionSesion: number;
      };
    } catch {
      return null;
    }
  }
}
