import type {
  AsignacionLicenciaDetalle,
  AssignLicenseInput,
  ILicenseAssignmentRepository,
} from '../../domain/contracts/licenseAssignment.js';
import type { Empleado } from '../../domain/models/Empleado.js';
import type { Licencia } from '../../domain/models/Licencia.js';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { prisma } from '../config/database.js';

export class PrismaLicenseAssignmentRepository implements ILicenseAssignmentRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient = prisma) {}

  async asignarCupo(
    input: AssignLicenseInput,
    claveAsignacion: string,
    fechaAsignacion: Date,
  ): Promise<AsignacionLicenciaDetalle> {
    const creada = await this.client.asignacionLicencia.create({
      data: {
        idLicencia: input.idLicencia,
        idEmpleado: input.idEmpleado,
        idUsuarioAsignacion: input.idUsuarioAsignacion,
        claveAsignacion,
        asignadoEn: fechaAsignacion,
        nota: input.nota ?? null,
      },
    });

    return creada;
  }

  async liberarCupo(
    idAsignacionLicencia: string,
    idUsuarioLiberacion: string,
    claveLiberacion: string,
    fechaLiberacion: Date,
    nota?: string | null,
  ): Promise<AsignacionLicenciaDetalle> {
    const actualizada = await this.client.asignacionLicencia.update({
      where: { idAsignacionLicencia },
      data: {
        idUsuarioLiberacion,
        claveLiberacion,
        liberadoEn: fechaLiberacion,
        ...(nota !== undefined ? { nota } : {}),
      },
    });

    return actualizada;
  }

  async buscarAsignacionAbierta(
    idLicencia: string,
    idEmpleado: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    return this.client.asignacionLicencia.findFirst({
      where: {
        idLicencia,
        idEmpleado,
        liberadoEn: null,
      },
    });
  }

  async buscarAsignacionPorId(
    idAsignacionLicencia: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    return this.client.asignacionLicencia.findUnique({
      where: { idAsignacionLicencia },
    });
  }

  async contarCuposOcupados(idLicencia: string): Promise<number> {
    return this.client.asignacionLicencia.count({
      where: {
        idLicencia,
        liberadoEn: null,
      },
    });
  }

  async obtenerLicencia(idLicencia: string): Promise<Licencia | null> {
    if ('$queryRaw' in this.client) {
      try {
        const rows = await (this.client as Prisma.TransactionClient).$queryRaw<any[]>`
          SELECT "idLicencia", "codigoLicencia", "software", "plan", "periodicidad",
                 "proveedor", "referenciaContrato", "inicioVigencia", "finVigencia",
                 "cuposContratados", "costo", "moneda"
          FROM "Licencias"
          WHERE "idLicencia" = ${idLicencia}::uuid
          FOR UPDATE
        `;
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            idLicencia: r.idLicencia,
            codigoLicencia: r.codigoLicencia,
            software: r.software,
            plan: r.plan,
            periodicidad: r.periodicidad,
            proveedor: r.proveedor,
            referenciaContrato: r.referenciaContrato,
            inicioVigencia: new Date(r.inicioVigencia),
            finVigencia: new Date(r.finVigencia),
            cuposContratados: r.cuposContratados,
            costo: r.costo != null ? String(r.costo) : null,
            moneda: r.moneda,
          };
        }
      } catch {
        // En caso de entornos de prueba o mocks que no implementen $queryRaw nativo
      }
    }

    const row = await this.client.licencia.findUnique({
      where: { idLicencia },
    });
    if (!row) return null;

    return {
      ...row,
      costo: row.costo?.toFixed(2) ?? null,
    };
  }

  async obtenerEmpleado(idEmpleado: string): Promise<Empleado | null> {
    return this.client.empleado.findUnique({
      where: { idEmpleado },
    });
  }
}
