import { prisma } from '../../database/prisma.js';

export interface DatosSesion {
  idUsuario: string;
  nombre: string;
  correo: string;
}

export async function obtenerSesion(idUsuario: string, versionSesion: number): Promise<DatosSesion | null> {
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

  // Reviso que la cuenta exista, esté activa y que la versión de sesión coincida con el token.
  if (!usuario || !usuario.activo || usuario.versionSesion !== versionSesion) {
    return null;
  }

  return {
    idUsuario: usuario.idUsuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
  };
}
