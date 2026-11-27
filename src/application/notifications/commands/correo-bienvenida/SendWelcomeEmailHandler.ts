import type {
  EmailDispatchResult,
  IMailService,
  IMailTemplateRenderer,
} from '../../../../domain/contracts/mail.js';
import type { SendWelcomeEmailCommand } from './SendWelcomeEmailCommand.js';
import type { SendWelcomeEmailHandlerOptions } from './SendWelcomeEmailHandlerOptions.js';

/**
 * Caso de uso HU03: Envío de correo de bienvenida opcional al registrar un usuario o empleado.
 *
 * Comportamiento resiliente:
 * - Si el envío está deshabilitado (bandera en el comando o MAIL_WELCOME_ENABLED=false), retorna SKIPPED.
 * - Si falla la red o el servidor SMTP, registra el incidente y retorna FAILED sin lanzar excepción,
 *   protegiendo el flujo principal de registro/alta.
 */
export class SendWelcomeEmailHandler {
  constructor(
    private readonly mailService: IMailService,
    private readonly templateRenderer: IMailTemplateRenderer,
    private readonly options: SendWelcomeEmailHandlerOptions = { welcomeEnabledByDefault: true },
  ) {}

  async handle(command: SendWelcomeEmailCommand): Promise<EmailDispatchResult> {
    const shouldSend = command.enviarCorreo ?? this.options.welcomeEnabledByDefault;

    if (!shouldSend) {
      return {
        status: 'SKIPPED',
        sent: false,
        recipient: command.correo,
        reason: 'Envío de correo de bienvenida omitido por configuración o parámetro opcional.',
      };
    }

    try {
      const rendered = this.templateRenderer.renderWelcomeEmail({
        nombre: command.nombre,
        correo: command.correo,
        tipoDestinatario: command.tipoDestinatario,
        numeroEmpleado: command.numeroEmpleado,
        departamento: command.departamento,
      });

      const result = await this.mailService.sendMail({
        to: command.correo,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      return {
        status: 'SENT',
        sent: true,
        recipient: command.correo,
        messageId: result.messageId,
        previewUrl: result.previewUrl,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[HU03][Correo Bienvenida] Falló el envío a ${command.correo} (flujo principal preservado): ${reason}`,
      );

      return {
        status: 'FAILED',
        sent: false,
        recipient: command.correo,
        reason,
      };
    }
  }
}
