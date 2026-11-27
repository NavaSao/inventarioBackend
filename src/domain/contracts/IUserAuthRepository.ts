import type { UserAuthEntity } from './authTypes.js';

/**
 * Repositorio de Autenticación de Usuario (SOLID ISP - Búsqueda de credenciales)
 */
export interface IUserAuthRepository {
  findByEmail(correo: string): Promise<UserAuthEntity | null>;
  findById(idUsuario: string): Promise<UserAuthEntity | null>;
}
