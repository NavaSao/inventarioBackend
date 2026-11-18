/**
 * Composition Root (Contenedor de Inyección de Dependencias).
 * Ensambla todo el grafo de dependencias de la aplicación en un único punto central.
 */
import { UserRepository } from '../repositories/UserRepository.js';
import { UserReadModel } from '../repositories/UserReadModel.js';
import { AuthService } from '../services/AuthService.js';
import { TokenService } from '../services/TokenService.js';
import { LoginHandler } from '../../application/commands/auth/LoginHandler.js';
import { GetSessionHandler } from '../../application/queries/auth/GetSessionHandler.js';
import { authControllerFactory } from '../../presentation/controllers/AuthController.js';
import { createAuthMiddleware } from '../../presentation/middlewares/auth.js';

// 1. Repositorios y ReadModels (Persistencia)
export const userRepository = new UserRepository();
export const userReadModel = new UserReadModel();

// 2. Servicios de Infraestructura
export const authService = new AuthService();
export const tokenService = new TokenService();

// 3. Orquestadores CQRS (Command y Query Handlers)
export const loginHandler = new LoginHandler(userRepository, authService, tokenService);
export const getSessionHandler = new GetSessionHandler(userReadModel);

// 4. Middlewares de Soporte
export const authMiddleware = createAuthMiddleware(tokenService);

// 5. Controladores HTTP
export const authController = authControllerFactory({
  loginHandler,
  getSessionHandler,
});
