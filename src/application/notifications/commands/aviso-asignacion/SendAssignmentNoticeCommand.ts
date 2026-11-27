import type { AssignmentNoticeData } from '../../../../domain/contracts/mail.js';

/**
 * DTO para la orden de aviso automático de asignación de activo o licencia (CQRS - Command, HU06).
 */
export class SendAssignmentNoticeCommand {
  constructor(public readonly payload: AssignmentNoticeData) {}
}
