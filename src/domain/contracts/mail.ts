/**
 * Contratos e Interfaces de Dominio para Notificaciones por Correo (HU03 y HU06).
 * Principios SOLID aplicados:
 * - ISP: Interfaces pequeñas y cohesivas (IMailService e IMailTemplateRenderer).
 * - DIP: Los Command Handlers dependen exclusivamente de estas abstracciones, no de Nodemailer.
 */

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  previewUrl?: string;
}

export type EmailDispatchStatus = 'SENT' | 'SKIPPED' | 'FAILED';

export interface EmailDispatchResult {
  status: EmailDispatchStatus;
  sent: boolean;
  recipient: string;
  messageId?: string;
  previewUrl?: string;
  reason?: string;
}

export type WelcomeRecipientType = 'EMPLEADO' | 'USUARIO';

export interface WelcomeEmailData {
  nombre: string;
  correo: string;
  tipoDestinatario: WelcomeRecipientType;
  numeroEmpleado?: string;
  departamento?: string;
}

export type AssignmentType = 'ACTIVO' | 'LICENCIA';

export interface AssetAssignmentDetails {
  nombreActivo: string;
  etiqueta: string;
  numeroSerie: string;
  categoria: string;
  ubicacion: string;
  marca?: string;
  modelo?: string;
}

export interface LicenseAssignmentDetails {
  software: string;
  proveedor?: string;
  referenciaContrato?: string;
  inicioVigencia?: string;
  finVigencia?: string;
}

export interface AssignmentNoticeBase {
  nombreEmpleado: string;
  correoEmpleado: string;
  numeroEmpleado?: string;
  departamento?: string;
  fechaAsignacion: Date;
  asignadoPor?: string;
  nota?: string;
}

export interface AssetAssignmentNoticeData extends AssignmentNoticeBase {
  tipo: 'ACTIVO';
  detalle: AssetAssignmentDetails;
}

export interface LicenseAssignmentNoticeData extends AssignmentNoticeBase {
  tipo: 'LICENCIA';
  detalle: LicenseAssignmentDetails;
}

export type AssignmentNoticeData = AssetAssignmentNoticeData | LicenseAssignmentNoticeData;

export interface RenderedEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Puerto de salida para envío de correos electrónicos (Adaptador SMTP en Infraestructura).
 */
export interface IMailService {
  sendMail(message: MailMessage): Promise<MailSendResult>;
  verifyConnection(): Promise<boolean>;
}

/**
 * Puerto de renderizado de plantillas HTML y texto plano para notificaciones.
 */
export interface IMailTemplateRenderer {
  renderWelcomeEmail(data: WelcomeEmailData): RenderedEmailTemplate;
  renderAssignmentNoticeEmail(data: AssignmentNoticeData): RenderedEmailTemplate;
}
