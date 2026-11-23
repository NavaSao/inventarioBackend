/**
 * Contratos e Interfaces del Sistema (Principios SOLID - ISP y DIP).
 * Permiten desacoplar los Casos de Uso (Handlers) de la infraestructura concreta.
 */

export interface UserAuthEntity {
  idUsuario: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  activo: boolean;
  versionSesion: number;
}

export interface UserSessionDTO {
  idUsuario: string;
  nombre: string;
  correo: string;
}

export interface UserSessionState extends UserSessionDTO {
  activo: boolean;
  versionSesion: number;
}

/**
 * Repositorio de Autenticación de Usuario (SOLID ISP - Búsqueda de credenciales)
 */
export interface IUserAuthRepository {
  findByEmail(correo: string): Promise<UserAuthEntity | null>;
  findById(idUsuario: string): Promise<UserAuthEntity | null>;
}

// Alias retrocompatible
export type IUserRepository = IUserAuthRepository;

/**
 * Repositorio para Invalidación de Sesiones Globales (SOLID ISP - HU02)
 */
export interface ISessionInvalidationRepository {
  incrementSessionVersion(idUsuario: string): Promise<void>;
}

/**
 * Modelo de Lectura Optimizado para Consultas de Sesión (CQRS - Queries / SOLID ISP)
 */
export interface ISessionQueryRepository {
  findSessionById(idUsuario: string, versionSesion: number): Promise<UserSessionDTO | null>;
  findById?(idUsuario: string): Promise<UserSessionState | null>;
}

// Interfaz retrocompatible para ReadModel
export interface IUserReadModel {
  findById(idUsuario: string): Promise<UserSessionState | null>;
  findSessionById(idUsuario: string, versionSesion: number): Promise<UserSessionDTO | null>;
}

/**
 * Servicio de Seguridad y Cifrado de Contraseñas (SOLID DIP)
 */
export interface IAuthService {
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  getComparisonHash(): Promise<string>;
}

/**
 * Servicio de Generación y Validación de Tokens JWT (SOLID DIP)
 */
export interface ITokenService {
  generateToken(idUsuario: string, versionSesion: number): string;
  verifyToken(token: string): { sub: string; versionSesion: number } | null;
}

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
