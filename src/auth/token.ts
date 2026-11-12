import 'dotenv/config';
import { obtenerContenedor } from '../container.js';

const secreto = process.env.JWT_SECRET?.trim();
if (!secreto || Buffer.byteLength(secreto, 'utf8') < 32) {
  throw new Error('Configura JWT_SECRET con al menos 32 bytes en .env.');
}

// Configuración de JWT exportada para compatibilidad
export const configuracionJwt = { secreto, algoritmo: 'HS256' } as const;

export function firmarToken(idUsuario: string, versionSesion: number): string {
  return obtenerContenedor().tokenService.firmarToken(idUsuario, versionSesion);
}

export function verificarToken(token: string) {
  return obtenerContenedor().tokenService.verificarToken(token);
}
