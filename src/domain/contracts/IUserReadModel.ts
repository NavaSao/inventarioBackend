import type { UserSessionDTO, UserSessionState } from './authTypes.js';

// Interfaz retrocompatible para ReadModel
export interface IUserReadModel {
  findById(idUsuario: string): Promise<UserSessionState | null>;
  findSessionById(idUsuario: string, versionSesion: number): Promise<UserSessionDTO | null>;
}
