/**
 * DTO para la orden de Inicio de Sesión (CQRS - Command).
 * Contiene estrictamente los parámetros de entrada requeridos.
 */
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
