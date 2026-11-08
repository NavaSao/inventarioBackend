import 'dotenv/config';
import jwt from 'jsonwebtoken';

const secreto = process.env.JWT_SECRET?.trim();
if (!secreto || Buffer.byteLength(secreto, 'utf8') < 32) {
  throw new Error('Configura JWT_SECRET con al menos 32 bytes en .env.');
}

// Dejo la configuración en un solo lugar para usarla también al verificar la sesión.
export const configuracionJwt = { secreto, algoritmo: 'HS256' } as const;

export function firmarToken(idUsuario: string, versionSesion: number): string {
  return jwt.sign({ versionSesion }, configuracionJwt.secreto, {
    algorithm: configuracionJwt.algoritmo,
    subject: idUsuario,
    expiresIn: '1h',
  });
}

export function verificarToken(token: string) {
  try {
    return jwt.verify(token, configuracionJwt.secreto) as {
      sub: string;
      versionSesion: number;
    };
  } catch {
    return null;
  }
}


