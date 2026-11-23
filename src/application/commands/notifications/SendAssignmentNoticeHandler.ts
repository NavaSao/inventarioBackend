import type {
  EmailDispatchResult,
  IMailService,
  IMailTemplateRenderer,
} from '../../../domain/contracts/mail.js';
import type { SendAssignmentNoticeCommand } from './SendAssignmentNoticeCommand.js';

/**
 * Caso de uso HU06: Aviso automático por correo al asignar un activo o licencia a un empleado.
 *
 * Comportamiento resiliente:
 * - Genera automáticamente la plantilla HTML y de texto plano con los datos relevantes de la asignación.
 * - Maneja errores de red/SMTP devolviendo un resultado controlado (FAILED) sin tumbar la transacción
 *   principal de asignación en base de datos.
 */
export class SendAssignmentNoticeHandler {
  constructor(
    private readonly mailService: IMailService,
    private readonly templateRenderer: IMailTemplateRenderer,
  ) {}

  async handle(command: SendAssignmentNoticeCommand): Promise<EmailDispatchResult> {
    const recipient = command.payload.correoEmpleado;

    try {
      const rendered = this.templateRenderer.renderAssignmentNoticeEmail(command.payload);

      const result = await this.mailService.sendMail({
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      return {
        status: 'SENT',
        sent: true,
        recipient,
        messageId: result.messageId,
        previewUrl: result.previewUrl,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[HU06][Aviso Asignación] Falló el envío a ${recipient} (flujo principal preservado): ${reason}`,
      );

      return {
        status: 'FAILED',
        sent: false,
        recipient,
        reason,
      };
    }
  }
}
