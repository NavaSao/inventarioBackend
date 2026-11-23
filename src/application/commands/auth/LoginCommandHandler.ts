import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import type { IUserAuthRepository, IAuthService, ITokenService } from '../../../domain/contracts/index.js';
import type { LoginCommand } from './LoginCommand.js';

export interface LoginResult {
  token: string;
  user: {
    idUsuario: string;
    nombre: string;
    correo: string;
  };
}

/**
 * Orquestador de autenticación y emisión de JWT (CQRS - Command Handler).
 * Cumple con el principio DIP (depende de abstracciones IUserAuthRepository, IAuthService, ITokenService).
 */
export class LoginCommandHandler {
  constructor(
    private readonly userAuthRepository: IUserAuthRepository,
    private readonly authService: IAuthService,
    private readonly tokenService: ITokenService,
  ) {}

  async handle(command: LoginCommand): Promise<LoginResult> {
    const usuario = await this.userAuthRepository.findByEmail(command.email);

    // Protección anti-timing attacks: siempre calcular comparación aunque el correo no exista
    const comparisonHash = usuario?.passwordHash ?? await this.authService.getComparisonHash();
    const isValid = await this.authService.verifyPassword(command.password, comparisonHash);

    if (!usuario || !usuario.activo || !isValid) {
      throw new BusinessError('Credenciales inválidas o cuenta deshabilitada', 401);
    }

    const token = this.tokenService.generateToken(usuario.idUsuario, usuario.versionSesion);

    return {
      token,
      user: {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    };
  }
}

// Alias retrocompatible
export { LoginCommandHandler as LoginHandler };
