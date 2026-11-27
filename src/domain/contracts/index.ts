import type { IUserAuthRepository } from './IUserAuthRepository.js';

/**
 * Contratos e Interfaces del Sistema (Principios SOLID - ISP y DIP).
 * Permiten desacoplar los Casos de Uso (Handlers) de la infraestructura concreta.
 */

export type { UserAuthEntity, UserSessionDTO, UserSessionState } from './authTypes.js';

export type { IUserAuthRepository } from './IUserAuthRepository.js';

// Alias retrocompatible
export type IUserRepository = IUserAuthRepository;

export type { ISessionInvalidationRepository } from './ISessionInvalidationRepository.js';

export type { ISessionQueryRepository } from './ISessionQueryRepository.js';

export type { IUserReadModel } from './IUserReadModel.js';

export type { IAuthService } from './IAuthService.js';

export type { ITokenService } from './ITokenService.js';

export type {
  MailMessage,
  MailSendResult,
  EmailDispatchStatus,
  EmailDispatchResult,
  WelcomeRecipientType,
  WelcomeEmailData,
  AssignmentType,
  AssetAssignmentDetails,
  LicenseAssignmentDetails,
  AssignmentNoticeBase,
  AssetAssignmentNoticeData,
  LicenseAssignmentNoticeData,
  AssignmentNoticeData,
  RenderedEmailTemplate,
  IMailService,
  IMailTemplateRenderer,
} from './mail.js';

export type {
  EmployeeFilterCriteria,
  EmployeeSelectorCriteria,
  EmployeeSelectorItem,
  IEmployeeSearchReadModel,
} from './employeeSearch.js';

export type {
  AsignacionLicenciaDetalle,
  AssignLicenseInput,
  ReleaseLicenseInput,
  AssignmentResult,
  AssignmentPreviewResult,
  ReleaseResult,
  ILicenseAssignmentRepository,
  ILicenseUnitOfWork,
  IAssignmentNotificationDispatcher,
} from './licenseAssignment.js';

export type {
  FiltroLicencias,
  ILicenciaRepository,
  ILicenciaReadModel,
  ILicenseHistoryReadModel,
} from './licencias.js';
