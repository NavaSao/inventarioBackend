import type { ReleaseLicenseInput } from '../../../../domain/contracts/licenseAssignment.js';

/**
 * Command para la liberación de un cupo de licencia (HU07 - CQRS).
 */
export class ReleaseLicenseCommand {
  constructor(public readonly payload: ReleaseLicenseInput) {}
}
