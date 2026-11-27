/**
 * DTO para la Consulta de Validación de Sesión Activa (CQRS - Query).
 */
export class ValidateSessionQuery {
  constructor(
    public readonly userId: string,
    public readonly sessionVersion: number,
  ) {}
}

// Alias retrocompatible
export { ValidateSessionQuery as GetSessionQuery };
