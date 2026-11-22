import type { IUserReadModel, UserSessionState } from '../../domain/contracts/index.js';
import { prisma } from '../config/database.js';

/**
 * UserReadModel: Modelo de lectura optimizado para consultas directas (CQRS - Queries).
 * No expone hashes de contraseña ni información sensible.
 */
export class UserReadModel implements IUserReadModel {
  findById(idUsuario: string): Promise<UserSessionState | null> {
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
}
