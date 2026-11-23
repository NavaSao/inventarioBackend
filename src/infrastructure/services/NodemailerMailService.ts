import nodemailer, { type Transporter } from 'nodemailer';
import type { IMailService, MailMessage, MailSendResult } from '../../domain/contracts/mail.js';
import { loadMailConfig, type MailConfig } from '../config/mail.js';

/**
 * Adaptador de Infraestructura SMTP usando Nodemailer.
 * Implementa el contrato de dominio IMailService (Principios DIP y OCP).
 * Soporta Ethereal Email (cuentas de prueba), Gmail y servidores SMTP estándar.
 */
export class NodemailerMailService implements IMailService {
  private transporter: Transporter | null = null;
  private readonly config: MailConfig;

  constructor(config: MailConfig = loadMailConfig()) {
    this.config = config;
  }

  private getTransporter(): Transporter {
    if (!this.config.isConfigured) {
      throw new Error(
        'SMTP no está configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASS en el archivo .env.',
      );
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
    }

    return this.transporter;
  }

  async verifyConnection(): Promise<boolean> {
    const transporter = this.getTransporter();
    await transporter.verify();
    return true;
  }

  async sendMail(message: MailMessage): Promise<MailSendResult> {
    const transporter = this.getTransporter();
    const info = await transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    const preview = nodemailer.getTestMessageUrl(info);

    return {
      messageId: info.messageId,
      accepted: (info.accepted ?? []).map(String),
      rejected: (info.rejected ?? []).map(String),
      previewUrl: typeof preview === 'string' ? preview : undefined,
    };
  }
}
