import type { PrismaClient } from '../../generated/prisma/client.js';
import type {
  CrearUsuarioInput,
  IUsuarioRepository,
  UsuarioAuthDto,
  UsuarioSesionDto,
} from '../../core/interfaces/usuarioRepository.interface.js';

export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorCorreo(correo: string): Promise<UsuarioAuthDto | null> {
    const usuario = await this.prisma.usuario.findUnique({
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

    if (!usuario) {
      return null;
    }

    return usuario;
  }

  async buscarPorId(idUsuario: string): Promise<UsuarioSesionDto | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        nombre: true,
        correo: true,
        activo: true,
        versionSesion: true,
      },
    });

    if (!usuario) {
      return null;
    }

    return usuario;
  }

  async crear(datos: CrearUsuarioInput): Promise<boolean> {
    const resultado = await this.prisma.usuario.createMany({
      data: [
        {
          nombre: datos.nombre,
          correo: datos.correo,
          passwordHash: datos.passwordHash,
        },
      ],
      skipDuplicates: true,
    });

    return resultado.count > 0;
  }
}
