import type { Empleado } from '../models/Empleado.js';
import type { Licencia } from '../models/Licencia.js';

/**
 * Despachador de notificaciones resiliente con reintentos para asignaciones (HU06).
 */
export interface IAssignmentNotificationDispatcher {
  dispatchAssignmentEmail(
    licencia: Licencia,
    empleado: Empleado,
    fechaAsignacion: Date,
    nombreUsuarioAsignacion?: string,
    nota?: string | null,
  ): Promise<{ status: 'SENT' | 'SKIPPED' | 'FAILED'; sent: boolean; reason?: string }>;
}
