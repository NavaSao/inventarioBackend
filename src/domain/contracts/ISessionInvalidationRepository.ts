/**
 * Repositorio para Invalidación de Sesiones Globales (SOLID ISP - HU02)
 */
export interface ISessionInvalidationRepository {
  incrementSessionVersion(idUsuario: string): Promise<void>;
}
