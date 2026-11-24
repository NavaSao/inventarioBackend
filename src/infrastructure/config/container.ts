/**
 * Composition Root (Contenedor de Inyección de Dependencias).
 * Ensambla todo el grafo de dependencias de la aplicación en un único punto central (DIP).
 */
import { UserRepository } from '../repositories/UserRepository.js';
import { UserReadModel } from '../repositories/UserReadModel.js';
import { LicenciaRepository } from '../repositories/LicenciaRepository.js';
import { EmpleadoRepository } from '../repositories/EmpleadoRepository.js';
import { AuthService } from '../services/AuthService.js';
import { TokenService } from '../services/TokenService.js';
import { NodemailerMailService } from '../services/NodemailerMailService.js';
import { MailTemplateRenderer } from '../services/MailTemplateRenderer.js';
import { mailConfig } from './mail.js';
import { LoginCommandHandler } from '../../application/commands/auth/LoginCommandHandler.js';
import { GlobalLogoutCommandHandler } from '../../application/commands/auth/GlobalLogoutCommandHandler.js';
import { ValidateSessionQueryHandler } from '../../application/queries/auth/ValidateSessionQueryHandler.js';
import { RegistrarLicenciaHandler } from '../../application/commands/licencias/RegistrarLicenciaHandler.js';
import { ConsultarLicenciaHandler, ListarLicenciasHandler } from '../../application/queries/licencias/LicenciaHandlers.js';
import { RegistrarEmpleadoHandler } from '../../application/commands/empleados/RegistrarEmpleadoHandler.js';
import { EditarEmpleadoHandler } from '../../application/commands/empleados/EditarEmpleadoHandler.js';
import { DesactivarEmpleadoHandler } from '../../application/commands/empleados/DesactivarEmpleadoHandler.js';
import { ListarEmpleadosHandler } from '../../application/queries/empleados/ListarEmpleadosHandler.js';
import { SendWelcomeEmailHandler } from '../../application/commands/notifications/SendWelcomeEmailHandler.js';
import { SendAssignmentNoticeHandler } from '../../application/commands/notifications/SendAssignmentNoticeHandler.js';
import { LoginController } from '../../presentation/controllers/LoginController.js';
import { GlobalLogoutController } from '../../presentation/controllers/GlobalLogoutController.js';
import { ValidateSessionController } from '../../presentation/controllers/ValidateSessionController.js';
import {
  ConsultarLicenciaController,
  ListarLicenciasController,
  RegistrarLicenciaController,
} from '../../presentation/controllers/LicenciaControllers.js';
import {
  DesactivarEmpleadoController,
  EditarEmpleadoController,
  ListarEmpleadosController,
  RegistrarEmpleadoController,
} from '../../presentation/controllers/EmpleadoControllers.js';
import { notificationControllerFactory } from '../../presentation/controllers/NotificationController.js';
import { AuthGuard } from '../../presentation/middlewares/authGuard.js';
import { crearGuardiaSesionActiva } from '../../presentation/middlewares/activeSession.js';
import { PrismaEmployeeSearchRepository } from '../repositories/PrismaEmployeeSearchRepository.js';
import { PrismaLicenseAssignmentRepository } from '../repositories/PrismaLicenseAssignmentRepository.js';
import { PrismaLicenseUnitOfWork } from '../repositories/PrismaLicenseUnitOfWork.js';
import { ResilientAssignmentNotificationDispatcher } from '../services/ResilientAssignmentNotificationDispatcher.js';
import { EmailRetryPolicy } from '../../application/services/EmailRetryPolicy.js';
import { SearchEmployeesQueryHandler } from '../../application/queries/empleados/SearchEmployeesQueryHandler.js';
import { SearchEmployeesSelectorQueryHandler } from '../../application/queries/empleados/SearchEmployeesSelectorQueryHandler.js';
import { AssignLicenseCommandHandler } from '../../application/commands/licencias/AssignLicenseCommandHandler.js';
import { ReleaseLicenseCommandHandler } from '../../application/commands/licencias/ReleaseLicenseCommandHandler.js';
import { SearchEmployeesController } from '../../presentation/controllers/SearchEmployeesController.js';
import { SearchEmployeesSelectorController } from '../../presentation/controllers/SearchEmployeesSelectorController.js';
import { AssignLicenseController } from '../../presentation/controllers/AssignLicenseController.js';
import { ReleaseLicenseController } from '../../presentation/controllers/ReleaseLicenseController.js';

// 1. Repositorios y ReadModels (Persistencia)
export const userRepository = new UserRepository();
export const userReadModel = new UserReadModel();
export const licenciaRepository = new LicenciaRepository();
export const empleadoRepository = new EmpleadoRepository();

// 2. Servicios de Infraestructura
export const authService = new AuthService();
export const tokenService = new TokenService();
export const mailService = new NodemailerMailService(mailConfig);
export const mailTemplateRenderer = new MailTemplateRenderer();

// 3. Orquestadores CQRS (Command y Query Handlers)
export const loginCommandHandler = new LoginCommandHandler(userRepository, authService, tokenService);
export const globalLogoutCommandHandler = new GlobalLogoutCommandHandler(userRepository);
export const validateSessionQueryHandler = new ValidateSessionQueryHandler(userReadModel);

export const registrarLicenciaHandler = new RegistrarLicenciaHandler(licenciaRepository);
export const listarLicenciasHandler = new ListarLicenciasHandler(licenciaRepository);
export const consultarLicenciaHandler = new ConsultarLicenciaHandler(licenciaRepository);

export const sendWelcomeEmailHandler = new SendWelcomeEmailHandler(
  mailService,
  mailTemplateRenderer,
  { welcomeEnabledByDefault: mailConfig.welcomeEnabledByDefault },
);
export const sendAssignmentNoticeHandler = new SendAssignmentNoticeHandler(
  mailService,
  mailTemplateRenderer,
);

export const registrarEmpleadoHandler = new RegistrarEmpleadoHandler(
  empleadoRepository,
  sendWelcomeEmailHandler,
);
export const editarEmpleadoHandler = new EditarEmpleadoHandler(empleadoRepository);
export const desactivarEmpleadoHandler = new DesactivarEmpleadoHandler(empleadoRepository);
export const listarEmpleadosHandler = new ListarEmpleadosHandler(empleadoRepository);

// Aliases retrocompatibles para Casos de Uso
export const loginHandler = loginCommandHandler;
export const getSessionHandler = validateSessionQueryHandler;

// 4. Guards / Middlewares desacoplados
export const authGuard = new AuthGuard(tokenService);
export const authMiddleware = authGuard.handle;
export const guardiaSesionActiva = crearGuardiaSesionActiva(validateSessionQueryHandler);

// 5. Controladores HTTP (Single Action Controllers y Factory Controllers)
export const loginController = new LoginController(loginCommandHandler);
export const globalLogoutController = new GlobalLogoutController(globalLogoutCommandHandler);
export const validateSessionController = new ValidateSessionController(validateSessionQueryHandler);

// Objeto agrupador retrocompatible si fuera necesario
export const authController = {
  login: loginController.execute,
  consultarSesion: validateSessionController.execute,
  logoutGlobal: globalLogoutController.execute,
};

export const registrarLicenciaController = new RegistrarLicenciaController(registrarLicenciaHandler);
export const listarLicenciasController = new ListarLicenciasController(listarLicenciasHandler);
export const consultarLicenciaController = new ConsultarLicenciaController(consultarLicenciaHandler);

export const registrarEmpleadoController = new RegistrarEmpleadoController(registrarEmpleadoHandler);
export const listarEmpleadosController = new ListarEmpleadosController(listarEmpleadosHandler);
export const editarEmpleadoController = new EditarEmpleadoController(editarEmpleadoHandler);
export const desactivarEmpleadoController = new DesactivarEmpleadoController(desactivarEmpleadoHandler);

export const notificationController = notificationControllerFactory({
  sendWelcomeEmailHandler,
  sendAssignmentNoticeHandler,
});

// 6. Componentes para HU03, HU06 y HU07 (CQRS + SOLID)
export const employeeSearchRepository = new PrismaEmployeeSearchRepository();
export const licenseAssignmentRepository = new PrismaLicenseAssignmentRepository();
export const licenseUnitOfWork = new PrismaLicenseUnitOfWork();

export const emailRetryPolicy = new EmailRetryPolicy();
export const assignmentNotificationDispatcher = new ResilientAssignmentNotificationDispatcher(
  sendAssignmentNoticeHandler,
  emailRetryPolicy,
);

export const searchEmployeesQueryHandler = new SearchEmployeesQueryHandler(employeeSearchRepository);
export const searchEmployeesSelectorQueryHandler = new SearchEmployeesSelectorQueryHandler(employeeSearchRepository);
export const assignLicenseCommandHandler = new AssignLicenseCommandHandler(
  licenseUnitOfWork,
  assignmentNotificationDispatcher,
);
export const releaseLicenseCommandHandler = new ReleaseLicenseCommandHandler(licenseUnitOfWork);

export const searchEmployeesController = new SearchEmployeesController(searchEmployeesQueryHandler);
export const searchEmployeesSelectorController = new SearchEmployeesSelectorController(searchEmployeesSelectorQueryHandler);
export const assignLicenseController = new AssignLicenseController(assignLicenseCommandHandler);
export const releaseLicenseController = new ReleaseLicenseController(releaseLicenseCommandHandler);
