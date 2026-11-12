import type { ICommandHandler } from '../../core/cqrs/command.interface.js';
import type { IPasswordHasher } from '../../core/interfaces/passwordHasher.interface.js';
import type { ITokenService } from '../../core/interfaces/tokenService.interface.js';
import type { IUsuarioReadRepository } from '../../core/interfaces/usuarioRepository.interface.js';
import { IniciarSesionCommand, type ResultadoIniciarSesion } from './iniciarSesion.command.js';

// Hash bcrypt de 12 rondas generado como salvaguarda constante contra análisis de tiempos
const HASH_SALVAGUARDA_DEFECTO = '$2b$12$e8YkYg4Z88yO0yMfZ6VzVuKzX6bHqLqLpC3J8b5xM1Y7wP2q9tZ.u';

export class IniciarSesionHandler implements ICommandHandler<IniciarSesionCommand, ResultadoIniciarSesion | null> {
  readonly tipoComando = IniciarSesionCommand.tipo;

  constructor(
    private readonly usuarioRepository: IUsuarioReadRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly dummyHash: string = HASH_SALVAGUARDA_DEFECTO
  ) {}

  async ejecutar(comando: IniciarSesionCommand): Promise<ResultadoIniciarSesion | null> {
    const usuario = await this.usuarioRepository.buscarPorCorreo(comando.correo);

    // Si el usuario no existe, realizamos la comparación contra el hash de salvaguarda para mitigar diferencias de tiempo
    const hashParaComparar = usuario?.passwordHash ?? this.dummyHash;
    const coincide = await this.passwordHasher.compare(comando.password, hashParaComparar);

    if (!usuario || !usuario.activo || !coincide) {
      return null;
    }

    const token = this.tokenService.firmarToken(usuario.idUsuario, usuario.versionSesion);
    return { token };
  }
}
