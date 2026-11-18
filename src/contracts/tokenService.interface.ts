export interface TokenPayload {
  readonly sub: string;
  readonly versionSesion: number;
  readonly [key: string]: unknown;
}

export interface ITokenService {
  firmarToken(idUsuario: string, versionSesion: number): string;
  verificarToken(token: string): TokenPayload | null;
}
