/**
 * Composition Root (Contenedor de Inyección de Dependencias).
 * Ensambla todo el grafo de dependencias de la aplicación en un único punto central (DIP).
 */
import { UserRepository } from '../repositories/UserRepository.js';
import { UserReadModel } from '../repositories/UserReadModel.js';
import { AuthService } from '../services/AuthService.js';
import { TokenService } from '../services/TokenService.js';
import { LoginCommandHandler } from '../../application/commands/auth/LoginCommandHandler.js';
import { GlobalLogoutCommandHandler } from '../../application/commands/auth/GlobalLogoutCommandHandler.js';
import { ValidateSessionQueryHandler } from '../../application/queries/auth/ValidateSessionQueryHandler.js';
import { LoginController } from '../../presentation/controllers/LoginController.js';
import { GlobalLogoutController } from '../../presentation/controllers/GlobalLogoutController.js';
import { ValidateSessionController } from '../../presentation/controllers/ValidateSessionController.js';
import { AuthGuard } from '../../presentation/middlewares/authGuard.js';
import { LicenciaRepository } from '../repositories/LicenciaRepository.js';
import { RegistrarLicenciaHandler } from '../../application/commands/licencias/RegistrarLicenciaHandler.js';
import { ConsultarLicenciaHandler, ListarLicenciasHandler } from '../../application/queries/licencias/LicenciaHandlers.js';
import {
  ConsultarLicenciaController,
  ListarLicenciasController,
  RegistrarLicenciaController,
} from '../../presentation/controllers/LicenciaControllers.js';
import { crearGuardiaSesionActiva } from '../../presentation/middlewares/activeSession.js';

// 1. Repositorios y ReadModels (Persistencia)
export const userRepository = new UserRepository();
export const userReadModel = new UserReadModel();

// 2. Servicios de Infraestructura
export const authService = new AuthService();
export const tokenService = new TokenService();

// 3. Orquestadores CQRS (Command y Query Handlers)
export const loginCommandHandler = new LoginCommandHandler(userRepository, authService, tokenService);
export const globalLogoutCommandHandler = new GlobalLogoutCommandHandler(userRepository);
export const validateSessionQueryHandler = new ValidateSessionQueryHandler(userReadModel);

// Aliases retrocompatibles para Casos de Uso
export const loginHandler = loginCommandHandler;
export const getSessionHandler = validateSessionQueryHandler;

// 4. Guard / Middleware desacoplado
export const authGuard = new AuthGuard(tokenService);
export const authMiddleware = authGuard.handle;
export const guardiaSesionActiva = crearGuardiaSesionActiva(validateSessionQueryHandler);

// 5. Single Action Controllers
export const loginController = new LoginController(loginCommandHandler);
export const globalLogoutController = new GlobalLogoutController(globalLogoutCommandHandler);
export const validateSessionController = new ValidateSessionController(validateSessionQueryHandler);

// Objeto agrupador retrocompatible si fuera necesario
export const authController = {
  login: loginController.execute,
  consultarSesion: validateSessionController.execute,
  logoutGlobal: globalLogoutController.execute,
};

const licenciaRepository = new LicenciaRepository();
export const registrarLicenciaController = new RegistrarLicenciaController(new RegistrarLicenciaHandler(licenciaRepository));
export const listarLicenciasController = new ListarLicenciasController(new ListarLicenciasHandler(licenciaRepository));
export const consultarLicenciaController = new ConsultarLicenciaController(new ConsultarLicenciaHandler(licenciaRepository));
