import type { AssignLicenseInput } from '../../../../domain/contracts/licenseAssignment.js';

/**
 * Command para la asignación atómica de un cupo de licencia a un empleado (HU06 - CQRS).
 */
export class AssignLicenseCommand {
  constructor(public readonly payload: AssignLicenseInput) {}
}
