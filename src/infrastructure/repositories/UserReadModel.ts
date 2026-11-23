import type { ISessionQueryRepository, IUserReadModel, UserSessionDTO, UserSessionState } from '../../domain/contracts/index.js';
import { prisma } from '../config/database.js';

/**
 * UserReadModel: Modelo de lectura optimizado para consultas directas (CQRS - Queries).
 * Implementa ISessionQueryRepository e IUserReadModel (SOLID ISP).
 * No expone hashes de contraseña ni información sensible.
 */
export class UserReadModel implements ISessionQueryRepository, IUserReadModel {
  async findById(idUsuario: string): Promise<UserSessionState | null> {
    return prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        nombre: true,
        correo: true,
        activo: true,
        versionSesion: true,
      },
    });
  }

  async findSessionById(idUsuario: string, versionSesion: number): Promise<UserSessionDTO | null> {
    const usuario = await this.findById(idUsuario);

    // Validar las reglas de negocio de sesión activa:
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
