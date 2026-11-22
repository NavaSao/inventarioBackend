/**
 * Contratos e Interfaces del Sistema (Principio D e I de SOLID).
 * Permiten desacoplar los Casos de Uso (Handlers) de la infraestructura (Prisma, JWT, Bcrypt).
 */

export interface UserAuthEntity {
  idUsuario: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  activo: boolean;
  versionSesion: number;
}

export interface UserSessionDTO {
  idUsuario: string;
  nombre: string;
  correo: string;
}

export interface UserSessionState extends UserSessionDTO {
  activo: boolean;
  versionSesion: number;
}

/**
 * Repositorio de Escritura y Autenticación (CQRS - Comandos)
 */
export interface IUserRepository {
  findByEmail(correo: string): Promise<UserAuthEntity | null>;
  findById(idUsuario: string): Promise<UserAuthEntity | null>;
}

/**
 * Modelo de Lectura Optimizado (CQRS - Consultas)
 */
export interface IUserReadModel {
  findById(idUsuario: string): Promise<UserSessionState | null>;
}

/**
 * Servicio de Seguridad y Cifrado
 */
export interface IAuthService {
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  getComparisonHash(): Promise<string>;
}

/**
 * Servicio de Generación y Validación de Tokens JWT
 */
export interface ITokenService {
  generateToken(idUsuario: string, versionSesion: number): string;
  verifyToken(token: string): { sub: string; versionSesion: number } | null;
}
