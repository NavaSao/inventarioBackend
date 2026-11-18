import type { IUserReadModel, UserSessionDTO } from '../../domain/contracts/index.js';
import { prisma } from '../config/database.js';

/**
 * UserReadModel: Modelo de lectura optimizado para consultas directas (CQRS - Queries).
 * No expone hashes de contraseña ni información sensible.
 */
export class UserReadModel implements IUserReadModel {
  async findSessionById(idUsuario: string, versionSesion: number): Promise<UserSessionDTO | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        nombre: true,
        correo: true,
        activo: true,
        versionSesion: true,
      },
    });

    // Validar las 3 reglas de negocio de sesión activa:
    if (!usuario || !usuario.activo || usuario.versionSesion !== versionSesion) {
      return null;
    }

    return {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
    };
  }
}
