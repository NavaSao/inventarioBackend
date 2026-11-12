import type { ICommandHandler } from '../../core/cqrs/command.interface.js';
import type { IPasswordHasher } from '../../core/interfaces/passwordHasher.interface.js';
import type { IUsuarioWriteRepository } from '../../core/interfaces/usuarioRepository.interface.js';
import { CrearAdminCommand, type ResultadoCrearAdmin } from './crearAdmin.command.js';

export class CrearAdminHandler implements ICommandHandler<CrearAdminCommand, ResultadoCrearAdmin> {
  readonly tipoComando = CrearAdminCommand.tipo;

  constructor(
    private readonly usuarioRepository: IUsuarioWriteRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async ejecutar(comando: CrearAdminCommand): Promise<ResultadoCrearAdmin> {
    const passwordHash = await this.passwordHasher.hash(comando.password);
    const creado = await this.usuarioRepository.crear({
      nombre: comando.nombre,
      correo: comando.correo,
      passwordHash,
    });

    return { creado };
  }
}
