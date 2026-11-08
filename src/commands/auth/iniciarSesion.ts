import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { costoBcrypt } from '../../auth/credenciales.js';
import { firmarToken } from '../../auth/token.js';
import { prisma } from '../../database/prisma.js';

const hashDeComparacion = await bcrypt.hash(randomBytes(24).toString('hex'), costoBcrypt);

export async function iniciarSesion(correo: string, password: string): Promise<string | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { correo },
    select: { idUsuario: true, passwordHash: true, activo: true, versionSesion: true },
  });

  // Hago la comparación también si el correo no existe para que el rechazo sea parecido.
  const coincide = await bcrypt.compare(password, usuario?.passwordHash ?? hashDeComparacion);
  if (!usuario?.activo || !coincide) return null;

  return firmarToken(usuario.idUsuario, usuario.versionSesion);
}
