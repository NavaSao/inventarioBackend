import type { MailMessage, MailSendResult } from './mail.js';

/**
 * Puerto de salida para envío de correos electrónicos (Adaptador SMTP en Infraestructura).
 */
export interface IMailService {
  sendMail(message: MailMessage): Promise<MailSendResult>;
  verifyConnection(): Promise<boolean>;
}
