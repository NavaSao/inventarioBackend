/**
 * DTO para la Consulta de Sesión Activa (CQRS - Query).
 */
export class GetSessionQuery {
  constructor(
    public readonly userId: string,
    public readonly sessionVersion: number,
  ) {}
}
