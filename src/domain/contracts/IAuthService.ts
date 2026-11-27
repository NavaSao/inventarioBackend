/**
 * Servicio de Seguridad y Cifrado de Contraseñas (SOLID DIP)
 */
export interface IAuthService {
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  getComparisonHash(): Promise<string>;
}
