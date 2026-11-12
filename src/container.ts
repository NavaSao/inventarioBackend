import 'dotenv/config';
import { InMemoryCommandBus } from './core/cqrs/commandBus.js';
import { InMemoryQueryBus } from './core/cqrs/queryBus.js';
import type { ICommandBus } from './core/cqrs/command.interface.js';
import type { IQueryBus } from './core/cqrs/query.interface.js';
import type { IPasswordHasher } from './core/interfaces/passwordHasher.interface.js';
import type { ITokenService } from './core/interfaces/tokenService.interface.js';
import type { IUsuarioRepository } from './core/interfaces/usuarioRepository.interface.js';
import { prisma as defaultPrisma } from './database/prisma.js';
import { BcryptPasswordHasher } from './infrastructure/security/bcryptPasswordHasher.js';
import { JwtTokenService } from './infrastructure/security/jwtTokenService.js';
import { PrismaUsuarioRepository } from './infrastructure/repositories/prismaUsuario.repository.js';
import { IniciarSesionHandler } from './commands/auth/iniciarSesion.handler.js';
import { CrearAdminHandler } from './commands/usuarios/crearAdmin.handler.js';
import { ObtenerSesionHandler } from './queries/auth/obtenerSesion.handler.js';

export interface ContenedorDependencias {
  readonly prisma: typeof defaultPrisma;
  readonly usuarioRepository: IUsuarioRepository;
  readonly passwordHasher: IPasswordHasher;
  readonly tokenService: ITokenService;
  readonly commandBus: ICommandBus;
  readonly queryBus: IQueryBus;
}

export interface OpcionesContenedor {
  readonly prisma?: typeof defaultPrisma;
  readonly usuarioRepository?: IUsuarioRepository;
  readonly passwordHasher?: IPasswordHasher;
  readonly tokenService?: ITokenService;
  readonly jwtSecret?: string;
  readonly costoBcrypt?: number;
}

export function crearContenedor(opciones: OpcionesContenedor = {}): ContenedorDependencias {
  const prisma = opciones.prisma ?? defaultPrisma;
  const usuarioRepository = opciones.usuarioRepository ?? new PrismaUsuarioRepository(prisma);
  const passwordHasher = opciones.passwordHasher ?? new BcryptPasswordHasher(opciones.costoBcrypt ?? 12);
  const jwtSecret = opciones.jwtSecret ?? process.env.JWT_SECRET ?? '';
  const tokenService = opciones.tokenService ?? new JwtTokenService({ secreto: jwtSecret });

  const commandBus = new InMemoryCommandBus();
  const queryBus = new InMemoryQueryBus();

  // Registro de manejadores de Comandos
  commandBus.registrar(new IniciarSesionHandler(usuarioRepository, passwordHasher, tokenService));
  commandBus.registrar(new CrearAdminHandler(usuarioRepository, passwordHasher));

  // Registro de manejadores de Consultas
  queryBus.registrar(new ObtenerSesionHandler(usuarioRepository));

  return {
    prisma,
    usuarioRepository,
    passwordHasher,
    tokenService,
    commandBus,
    queryBus,
  };
}

let instanciaPorDefecto: ContenedorDependencias | null = null;

export function obtenerContenedor(): ContenedorDependencias {
  if (!instanciaPorDefecto) {
    instanciaPorDefecto = crearContenedor();
  }
  return instanciaPorDefecto;
}
