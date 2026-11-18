import type { ICommandHandler } from '../../core/cqrs/command.interface.js';
import type { IPasswordHasher } from '../../contracts/passwordHasher.interface.js';
import type { ITokenService } from '../../contracts/tokenService.interface.js';
import type { IUsuarioLoginRepository } from '../../contracts/usuarioRepository.interface.js';
import { IniciarSesionCommand, type ResultadoIniciarSesion } from './LoginCommand.js';

export class IniciarSesionHandler implements ICommandHandler<IniciarSesionCommand, ResultadoIniciarSesion | null> {
  readonly tipoComando = IniciarSesionCommand.tipo;

  constructor(
    private readonly usuarioRepository: IUsuarioLoginRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async ejecutar(comando: IniciarSesionCommand): Promise<ResultadoIniciarSesion | null> {
    const usuario = await this.usuarioRepository.buscarPorCorreo(comando.correo);

    const coincide = await this.passwordHasher.compare(comando.password, usuario?.passwordHash ?? null);

    if (!usuario || !usuario.activo || !coincide) {
      return null;
    }

    const token = this.tokenService.firmarToken(usuario.idUsuario, usuario.versionSesion);
    return { token };
  }
}
