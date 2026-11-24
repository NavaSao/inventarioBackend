import type {
  ILicenseAssignmentRepository,
  ILicenseUnitOfWork,
} from '../../domain/contracts/licenseAssignment.js';
import { prisma } from '../config/database.js';
import { PrismaLicenseAssignmentRepository } from './PrismaLicenseAssignmentRepository.js';

/**
 * Implementación de Unidad de Trabajo para Asignación y Liberación de Licencias (ACID).
 * Encapsula la transacción atómica de PostgreSQL con Prisma.
 */
export class PrismaLicenseUnitOfWork implements ILicenseUnitOfWork {
  constructor(private readonly db = prisma) {}

  async executeInTransaction<T>(
    operation: (repo: ILicenseAssignmentRepository) => Promise<T>,
  ): Promise<T> {
    return this.db.$transaction(async (tx) => {
      const txRepo = new PrismaLicenseAssignmentRepository(tx);
      return operation(txRepo);
    });
  }
}
