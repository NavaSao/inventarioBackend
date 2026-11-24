import type { IAssignmentNotificationDispatcher } from '../../domain/contracts/licenseAssignment.js';
import type { Empleado } from '../../domain/models/Empleado.js';
import type { Licencia } from '../../domain/models/Licencia.js';
import { SendAssignmentNoticeCommand } from '../../application/commands/notifications/SendAssignmentNoticeCommand.js';
import type { SendAssignmentNoticeHandler } from '../../application/commands/notifications/SendAssignmentNoticeHandler.js';
import { EmailRetryPolicy } from '../../application/services/EmailRetryPolicy.js';

/**
 * Adaptador de infraestructura para despacho resiliente de notificaciones por correo (HU06).
 * Emplea EmailRetryPolicy para tolerar demoras o caídas temporales de SMTP sin fallar la transacción.
 */
export class ResilientAssignmentNotificationDispatcher
  implements IAssignmentNotificationDispatcher
{
  constructor(
    private readonly sendAssignmentNoticeHandler: SendAssignmentNoticeHandler,
    private readonly retryPolicy: EmailRetryPolicy = new EmailRetryPolicy(),
  ) {}

  async dispatchAssignmentEmail(
    licencia: Licencia,
    empleado: Empleado,
    fechaAsignacion: Date,
    nombreUsuarioAsignacion?: string,
    nota?: string | null,
  ): Promise<{ status: 'SENT' | 'SKIPPED' | 'FAILED'; sent: boolean; reason?: string }> {
    const command = new SendAssignmentNoticeCommand({
      tipo: 'LICENCIA',
      nombreEmpleado: empleado.nombre,
      correoEmpleado: empleado.correo,
      numeroEmpleado: empleado.numeroEmpleado,
      departamento: empleado.departamento ?? undefined,
      fechaAsignacion,
      asignadoPor: nombreUsuarioAsignacion ?? 'Administrador AssetOps',
      nota: nota ?? undefined,
      detalle: {
        software: licencia.software,
        proveedor: licencia.proveedor ?? undefined,
        referenciaContrato: licencia.referenciaContrato ?? undefined,
        inicioVigencia: licencia.inicioVigencia.toISOString().slice(0, 10),
        finVigencia: licencia.finVigencia.toISOString().slice(0, 10),
      },
    });

    return this.retryPolicy.execute(async () => {
      const result = await this.sendAssignmentNoticeHandler.handle(command);
      return {
        status: result.status,
        sent: result.sent,
        reason: result.reason,
      };
    });
  }
}
