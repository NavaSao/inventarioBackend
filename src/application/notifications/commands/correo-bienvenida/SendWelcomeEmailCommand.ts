import type { WelcomeRecipientType } from '../../../../domain/contracts/mail.js';

/**
 * DTO para la orden de envío de correo de bienvenida (CQRS - Command, HU03).
 * `enviarCorreo` es opcional: si se omite, el Handler usa la configuración global MAIL_WELCOME_ENABLED.
 */
export class SendWelcomeEmailCommand {
  constructor(
    public readonly nombre: string,
    public readonly correo: string,
    public readonly tipoDestinatario: WelcomeRecipientType = 'EMPLEADO',
    public readonly enviarCorreo?: boolean,
    public readonly numeroEmpleado?: string,
    public readonly departamento?: string,
  ) {}
}
