/**
 * DTO para la orden de Cierre de Sesión Global (CQRS - Command).
 * Contiene el id del usuario cuyas sesiones previas serán revocadas.
 */
export class GlobalLogoutCommand {
  constructor(public readonly userId: string) {}
}
