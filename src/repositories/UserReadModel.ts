import type { PrismaClient } from '../generated/prisma/client.js';
import type { IUsuarioReadRepository, UsuarioSesionDto } from '../contracts/usuarioRepository.interface.js';

export class UserReadModel implements IUsuarioReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  buscarPorId(idUsuario: string): Promise<UsuarioSesionDto | null> {
    // La consulta de sesión solo lee los datos necesarios para validar y mostrar al usuario.
    return this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: { idUsuario: true, nombre: true, correo: true, activo: true, versionSesion: true },
    });
  }
}
