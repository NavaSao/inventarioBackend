import type {
  FiltroLicencias,
  ILicenciaReadModel,
  ILicenciaRepository,
  ILicenseHistoryReadModel,
} from '../../domain/contracts/licencias.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import {
  DIAS_AVISO_VENCIMIENTO,
  type CupoAsignado,
  type DatosLicencia,
  type Licencia,
  type MovimientoLicenciaHistorial,
} from '../../domain/models/Licencia.js';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../config/database.js';

const camposLicencia = {
  idLicencia: true,
  codigoLicencia: true,
  software: true,
  plan: true,
  periodicidad: true,
  proveedor: true,
  referenciaContrato: true,
  inicioVigencia: true,
  finVigencia: true,
  cuposContratados: true,
  costo: true,
  moneda: true,
} satisfies Prisma.LicenciaSelect;

const camposMovimiento = {
  idAsignacionLicencia: true,
  asignadoEn: true,
  liberadoEn: true,
  claveAsignacion: true,
  claveLiberacion: true,
  nota: true,
  empleado: {
    select: {
      idEmpleado: true,
      numeroEmpleado: true,
      nombre: true,
      correo: true,
      departamento: true,
      activo: true,
    },
  },
  asignadoPor: {
    select: {
      idUsuario: true,
      nombre: true,
    },
  },
  liberadoPor: {
    select: {
      idUsuario: true,
      nombre: true,
    },
  },
} satisfies Prisma.AsignacionLicenciaSelect;

type FilaLicencia = Prisma.LicenciaGetPayload<{ select: typeof camposLicencia }>;
type FilaMovimiento = Prisma.AsignacionLicenciaGetPayload<{ select: typeof camposMovimiento }>;

function convertirLicencia({ costo, ...licencia }: FilaLicencia): Licencia {
  return { ...licencia, costo: costo?.toFixed(2) ?? null };
}

function mapearMovimiento(mov: FilaMovimiento): MovimientoLicenciaHistorial {
  return {
    idAsignacionLicencia: mov.idAsignacionLicencia,
    estado: mov.liberadoEn === null ? 'ACTIVA' : 'LIBERADA',
    asignadoEn: mov.asignadoEn,
    liberadoEn: mov.liberadoEn,
    claveAsignacion: mov.claveAsignacion,
    claveLiberacion: mov.claveLiberacion,
    nota: mov.nota,
    empleado: mov.empleado,
    asignadoPor: mov.asignadoPor,
    liberadoPor: mov.liberadoPor,
  };
}

function filtroDeVigencia(estado: FiltroLicencias['estado'], hoy: Date) {
  const limite = new Date(hoy);
  limite.setUTCDate(hoy.getUTCDate() + DIAS_AVISO_VENCIMIENTO);

  switch (estado) {
    case 'VENCIDA': return { lte: hoy };
    case 'POR_VENCER': return { gt: hoy, lt: limite };
    case 'VIGENTE': return { gte: limite };
    default: return undefined;
  }
}

export class LicenciaRepository
  implements ILicenciaRepository, ILicenciaReadModel, ILicenseHistoryReadModel
{
  async registrar(datos: DatosLicencia): Promise<Licencia> {
    try {
      const licencia = await prisma.licencia.create({ data: datos, select: camposLicencia });
      return convertirLicencia(licencia);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BusinessError('El código de licencia ya está registrado', 409);
      }
      throw error;
    }
  }

  async listar(filtros: FiltroLicencias, hoy: Date) {
    // Busco el texto literal, incluso si incluye símbolos de LIKE.
    const busqueda = filtros.busqueda?.replace(/[\\%_]/g, '\\$&');
    const where: Prisma.LicenciaWhereInput = {
      finVigencia: filtroDeVigencia(filtros.estado, hoy),
    };
    if (busqueda) {
      where.OR = [
        { software: { contains: busqueda, mode: 'insensitive' } },
        { codigoLicencia: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    const licencias = await prisma.licencia.findMany({
      where,
      orderBy: [{ finVigencia: 'asc' }, { software: 'asc' }, { idLicencia: 'asc' }],
      select: {
        ...camposLicencia,
        _count: { select: { asignaciones: { where: { liberadoEn: null } } } },
      },
    });

    return licencias.map(({ _count, ...licencia }) => ({
      ...convertirLicencia(licencia),
      cuposAsignados: _count.asignaciones,
    }));
  }

  async consultar(idLicencia: string) {
    const licencia = await prisma.licencia.findUnique({
      where: { idLicencia },
      select: {
        ...camposLicencia,
        asignaciones: {
          orderBy: { asignadoEn: 'desc' },
          select: camposMovimiento,
        },
      },
    });
    if (!licencia) return null;

    const { asignaciones, ...datos } = licencia;
    const historialAsignaciones = asignaciones.map(mapearMovimiento);
    const empleadosAsignados: CupoAsignado[] = asignaciones
      .filter((a) => a.liberadoEn === null)
      .map((a) => ({
        idAsignacionLicencia: a.idAsignacionLicencia,
        asignadoEn: a.asignadoEn,
        empleado: {
          idEmpleado: a.empleado.idEmpleado,
          numeroEmpleado: a.empleado.numeroEmpleado,
          nombre: a.empleado.nombre,
          departamento: a.empleado.departamento,
        },
      }));

    return { ...convertirLicencia(datos), empleadosAsignados, historialAsignaciones };
  }

  async consultarHistorial(idLicencia: string) {
    const detalle = await this.consultar(idLicencia);
    if (!detalle) return null;

    const { empleadosAsignados, historialAsignaciones, ...licencia } = detalle;
    return {
      licencia,
      cuposAsignados: empleadosAsignados.length,
      historial: historialAsignaciones,
    };
  }
}
