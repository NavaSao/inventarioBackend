import type { UserSessionDTO, UserSessionState } from './authTypes.js';

/**
 * Modelo de Lectura Optimizado para Consultas de Sesión (CQRS - Queries / SOLID ISP)
 */
export interface ISessionQueryRepository {
  findSessionById(idUsuario: string, versionSesion: number): Promise<UserSessionDTO | null>;
  findById?(idUsuario: string): Promise<UserSessionState | null>;
}
