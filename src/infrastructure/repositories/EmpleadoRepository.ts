import type { IEmpleadoReadModel, IEmpleadoRepository } from '../../domain/contracts/empleados.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import type { DatosCrearEmpleado, DatosEditarEmpleado, Empleado, EmpleadoResumen } from '../../domain/models/Empleado.js';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../config/database.js';

export class EmpleadoRepository implements IEmpleadoRepository, IEmpleadoReadModel {
  async crear(datos: DatosCrearEmpleado): Promise<Empleado> {
    try {
      const empleado = await prisma.empleado.create({
        data: {
          numeroEmpleado: datos.numeroEmpleado,
          nombre: datos.nombre,
          correo: datos.correo,
          departamento: datos.departamento,
          cargo: datos.cargo,
          activo: true,
        },
      });

      return empleado;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const metaTarget = String(error.meta?.target ?? '');
        if (metaTarget.includes('correo')) {
          throw new BusinessError('El correo electrónico ya está registrado', 409);
        }
        if (metaTarget.includes('numeroEmpleado')) {
          throw new BusinessError('El número de empleado ya está registrado', 409);
        }
        throw new BusinessError('El correo o número de empleado ya se encuentra registrado', 409);
      }
      throw error;
    }
  }

  async editar(idEmpleado: string, datos: DatosEditarEmpleado): Promise<Empleado> {
    try {
      const empleado = await prisma.empleado.update({
        where: { idEmpleado },
        data: {
          numeroEmpleado: datos.numeroEmpleado,
          nombre: datos.nombre,
          correo: datos.correo,
          departamento: datos.departamento,
          cargo: datos.cargo,
        },
      });

      return empleado;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const metaTarget = String(error.meta?.target ?? '');
        if (metaTarget.includes('correo')) {
          throw new BusinessError('El correo electrónico ya está registrado por otro empleado', 409);
        }
        if (metaTarget.includes('numeroEmpleado')) {
          throw new BusinessError('El número de empleado ya está registrado por otro empleado', 409);
        }
        throw new BusinessError('El correo o número de empleado ya se encuentra registrado', 409);
      }
      throw error;
    }
  }

  async desactivar(idEmpleado: string): Promise<Empleado> {
    return prisma.empleado.update({
      where: { idEmpleado },
      data: { activo: false },
    });
  }

  async buscarPorId(idEmpleado: string): Promise<Empleado | null> {
    return prisma.empleado.findUnique({
      where: { idEmpleado },
    });
  }

  async buscarPorCorreo(correo: string): Promise<Empleado | null> {
    return prisma.empleado.findUnique({
      where: { correo },
    });
  }

  async buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Empleado | null> {
    return prisma.empleado.findUnique({
      where: { numeroEmpleado },
    });
  }

  async contarLicenciasActivas(idEmpleado: string): Promise<number> {
    return prisma.asignacionLicencia.count({
      where: {
        idEmpleado,
        liberadoEn: null,
      },
    });
  }

  async listar(): Promise<EmpleadoResumen[]> {
    const filas = await prisma.empleado.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        _count: {
          select: {
            asignacionesLicencias: {
              where: { liberadoEn: null },
            },
          },
        },
      },
    });

    return filas.map((fila) => ({
      idEmpleado: fila.idEmpleado,
      numeroEmpleado: fila.numeroEmpleado,
      nombre: fila.nombre,
      correo: fila.correo,
      departamento: fila.departamento,
      cargo: fila.cargo,
      activo: fila.activo,
      creadoEn: fila.creadoEn,
      actualizadoEn: fila.actualizadoEn,
      licenciasAsignadas: fila._count.asignacionesLicencias,
    }));
  }

  async consultar(idEmpleado: string): Promise<EmpleadoResumen | null> {
    const fila = await prisma.empleado.findUnique({
      where: { idEmpleado },
      include: {
        _count: {
          select: {
            asignacionesLicencias: {
              where: { liberadoEn: null },
            },
          },
        },
      },
    });

    if (!fila) {
      return null;
    }

    return {
      idEmpleado: fila.idEmpleado,
      numeroEmpleado: fila.numeroEmpleado,
      nombre: fila.nombre,
      correo: fila.correo,
      departamento: fila.departamento,
      cargo: fila.cargo,
      activo: fila.activo,
      creadoEn: fila.creadoEn,
      actualizadoEn: fila.actualizadoEn,
      licenciasAsignadas: fila._count.asignacionesLicencias,
    };
  }
}
