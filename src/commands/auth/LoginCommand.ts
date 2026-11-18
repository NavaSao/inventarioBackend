import type { ICommand } from '../../core/cqrs/command.interface.js';

export interface ResultadoIniciarSesion {
  readonly token: string;
}

export class IniciarSesionCommand implements ICommand {
  static readonly tipo = 'auth.iniciarSesion';
  readonly tipo = IniciarSesionCommand.tipo;

  constructor(
    public readonly correo: string,
    public readonly password: string
  ) {}
}
