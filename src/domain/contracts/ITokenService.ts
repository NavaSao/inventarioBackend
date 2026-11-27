/**
 * Servicio de Generación y Validación de Tokens JWT (SOLID DIP)
 */
export interface ITokenService {
  generateToken(idUsuario: string, versionSesion: number): string;
  verifyToken(token: string): { sub: string; versionSesion: number } | null;
}
