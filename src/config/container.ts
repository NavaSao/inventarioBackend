import 'dotenv/config';
import { crearAuthController } from '../controllers/AuthController.js';
import { InMemoryCommandBus } from '../core/cqrs/commandBus.js';
import { InMemoryQueryBus } from '../core/cqrs/queryBus.js';
import { crearMiddlewareAuth } from '../middlewares/auth.js';
import { BcryptPasswordHasher } from '../services/AuthService.js';
import { JwtTokenService } from '../services/TokenService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { UserReadModel } from '../repositories/UserReadModel.js';
import { IniciarSesionHandler } from '../commands/auth/LoginHandler.js';
import { CrearAdminHandler } from '../commands/usuarios/crearAdmin.handler.js';
import { ObtenerSesionHandler } from '../queries/auth/GetSessionHandler.js';
import { crearRutasAuth } from '../routes/authRoutes.js';
import { prisma } from './database.js';

export function crearContenedor() {
  const usuarioRepository = new UserRepository(prisma);
  const usuarioReadModel = new UserReadModel(prisma);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService({ secreto: process.env.JWT_SECRET ?? '' });

  const commandBus = new InMemoryCommandBus();
  commandBus.registrar(new IniciarSesionHandler(usuarioRepository, passwordHasher, tokenService));
  commandBus.registrar(new CrearAdminHandler(usuarioRepository, passwordHasher));

  const queryBus = new InMemoryQueryBus();
  queryBus.registrar(new ObtenerSesionHandler(usuarioReadModel));

  const controller = crearAuthController(commandBus, queryBus);
  const rutasAuth = crearRutasAuth(controller, crearMiddlewareAuth(tokenService));

  return { prisma, commandBus, rutasAuth };
}
