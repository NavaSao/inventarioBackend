import type { ICommand } from '../../core/cqrs/command.interface.js';

export interface ResultadoCrearAdmin {
  readonly creado: boolean;
}

export class CrearAdminCommand implements ICommand {
  static readonly tipo = 'usuarios.crearAdmin';
  readonly tipo = CrearAdminCommand.tipo;

  constructor(
    public readonly nombre: string,
    public readonly correo: string,
    public readonly password: string
  ) {}
}
