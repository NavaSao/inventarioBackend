import { randomUUID } from 'node:crypto';
import type {
  FiltroActivos,
  IActivoReadModel,
  IActivoRepository,
  IMovimientosActivoRepository,
  MovimientoActivo,
} from '../../domain/contracts/activos.js';
import { EstadoActivo } from '../../domain/enums/EstadoActivo.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import { TRANSICIONES, type AccionActivo, type Activo, type ActivoDetalle, type DatosActivo } from '../../domain/models/Activo.js';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../config/database.js';

const camposActivo = {
  idActivo: true,
  nombre: true,
  numeroSerie: true,
  etiqueta: true,
  categoria: true,
  ubicacion: true,
  marca: true,
  modelo: true,
  estado: true,
  fotoReferencia: true,
  creadoEn: true,
  actualizadoEn: true,
} satisfies Prisma.ActivoSelect;

const camposDetalle = {
  ...camposActivo,
  asignaciones: {
    where: { devueltoEn: null },
    select: {
      entregadoEn: true,
      empleado: { select: { idEmpleado: true, numeroEmpleado: true, nombre: true, departamento: true } },
    },
  },
  mantenimientos: {
    where: { cerradoEn: null },
    select: { iniciadoEn: true, notaInicial: true },
  },
} satisfies Prisma.ActivoSelect;

type Transaccion = Prisma.TransactionClient;

function duplicado(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new BusinessError('El número de serie o la etiqueta UUID ya están registrados en otro activo', 409);
  }
  throw error;
}

/** Cambia el estado solo si el activo sigue en el estado de origen (evita carreras entre dispositivos). */
async function transicionar(tx: Transaccion, idActivo: string, accion: AccionActivo): Promise<void> {
  const { desde, hacia } = TRANSICIONES[accion];
  const { count } = await tx.activo.updateMany({ where: { idActivo, estado: desde }, data: { estado: hacia } });
  if (count === 0) {
    throw new BusinessError('El activo cambió de estado mientras se procesaba. Actualiza la ficha.', 409);
  }
}

export class ActivoRepository implements IActivoRepository, IActivoReadModel, IMovimientosActivoRepository {
  async registrar(datos: DatosActivo): Promise<Activo> {
    return prisma.activo.create({ data: datos, select: camposActivo }).catch(duplicado);
  }

  async editar(idActivo: string, datos: DatosActivo): Promise<Activo> {
    return prisma.activo.update({ where: { idActivo }, data: datos, select: camposActivo }).catch(duplicado);
  }

  async actualizarFoto(idActivo: string, fotoReferencia: string): Promise<void> {
    await prisma.activo.update({ where: { idActivo }, data: { fotoReferencia } });
  }

  async listar({ busqueda, estado }: FiltroActivos): Promise<Activo[]> {
    const texto = busqueda?.replace(/[\\%_]/g, '\\$&');
    const contiene = { contains: texto, mode: 'insensitive' as const };
    return prisma.activo.findMany({
      where: {
        estado: estado ?? { not: EstadoActivo.DADO_DE_BAJA },
        ...(texto && {
          OR: [{ nombre: contiene }, { numeroSerie: contiene }, { etiqueta: contiene }, { categoria: contiene }, { ubicacion: contiene }],
        }),
      },
      orderBy: { actualizadoEn: 'desc' },
      select: camposActivo,
    });
  }

  async consultar(criterio: { idActivo: string } | { etiqueta: string }): Promise<ActivoDetalle | null> {
    const fila = await prisma.activo.findUnique({ where: criterio, select: camposDetalle });
    if (!fila) return null;
    const { asignaciones, mantenimientos, ...activo } = fila;
    return {
      ...activo,
      asignacionActual: asignaciones[0] ?? null,
      mantenimientoActual: mantenimientos[0] ?? null,
    };
  }

  async asignar({ idActivo, idEmpleado, idUsuario, nota }: MovimientoActivo & { idEmpleado: string }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await transicionar(tx, idActivo, 'ASIGNAR');
      await tx.asignacionActivo.create({
        data: { idActivo, idEmpleado, idUsuarioEntrega: idUsuario, notaEntrega: nota, claveEntrega: randomUUID() },
      });
    });
  }

  async devolver({ idActivo, idUsuario, nota }: MovimientoActivo): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await transicionar(tx, idActivo, 'DEVOLVER');
      await tx.asignacionActivo.updateMany({
        where: { idActivo, devueltoEn: null },
        data: { devueltoEn: new Date(), idUsuarioDevolucion: idUsuario, notaDevolucion: nota, claveDevolucion: randomUUID() },
      });
    });
  }

  async iniciarMantenimiento({ idActivo, idUsuario, nota }: MovimientoActivo & { nota: string }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await transicionar(tx, idActivo, 'INICIAR_MANTENIMIENTO');
      await tx.mantenimiento.create({
        data: { idActivo, idUsuarioInicio: idUsuario, notaInicial: nota, claveInicio: randomUUID() },
      });
    });
  }

  async cerrarMantenimiento({ idActivo, idUsuario, nota }: MovimientoActivo): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await transicionar(tx, idActivo, 'CERRAR_MANTENIMIENTO');
      await tx.mantenimiento.updateMany({
        where: { idActivo, cerradoEn: null },
        data: { cerradoEn: new Date(), idUsuarioCierre: idUsuario, resolucion: nota, claveCierre: randomUUID() },
      });
    });
  }
}
