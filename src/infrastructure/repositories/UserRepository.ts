import type { IUserRepository, UserAuthEntity } from '../../domain/contracts/index.js';
import { prisma } from '../config/database.js';

/**
 * UserRepository: Repositorio para operaciones de comando y mutación (CQRS - Commands).
 */
export class UserRepository implements IUserRepository {
  async findByEmail(correo: string): Promise<UserAuthEntity | null> {
    return prisma.usuario.findUnique({
      where: { correo },
      select: {
        idUsuario: true,
        nombre: true,
        correo: true,
        passwordHash: true,
        activo: true,
        versionSesion: true,
      },
    });
  }

  async findById(idUsuario: string): Promise<UserAuthEntity | null> {
    return prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        nombre: true,
        correo: true,
        passwordHash: true,
        activo: true,
        versionSesion: true,
      },
    });
  }
}
