import type { ILicenseAssignmentRepository } from './ILicenseAssignmentRepository.js';

/**
 * Abstracción de Unidad de Trabajo / Transacciones Atómicas (DIP y ACID).
 */
export interface ILicenseUnitOfWork {
  executeInTransaction<T>(
    operation: (repo: ILicenseAssignmentRepository) => Promise<T>,
  ): Promise<T>;
}
