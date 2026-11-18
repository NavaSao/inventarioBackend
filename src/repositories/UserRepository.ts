import type { PrismaClient } from '../generated/prisma/client.js';
import type {
  CrearUsuarioInput,
  IUsuarioLoginRepository,
  IUsuarioWriteRepository,
  UsuarioAuthDto,
} from '../contracts/usuarioRepository.interface.js';

export class UserRepository implements IUsuarioLoginRepository, IUsuarioWriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  buscarPorCorreo(correo: string): Promise<UsuarioAuthDto | null> {
    return this.prisma.usuario.findUnique({
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

  async crear(datos: CrearUsuarioInput): Promise<boolean> {
    const resultado = await this.prisma.usuario.createMany({ data: [datos], skipDuplicates: true });
    return resultado.count > 0;
  }
}
