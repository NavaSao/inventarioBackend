import { Router } from 'express';
import { iniciarSesion } from '../commands/auth/iniciarSesion.js';
import { obtenerSesion } from '../queries/auth/obtenerSesion.js';
import { credencialesSchema } from './credenciales.js';
import { verificarToken } from './token.js';

export const rutasAuth = Router();

rutasAuth.post('/login', async (req, res) => {
  const entrada = credencialesSchema.safeParse(req.body);
  if (!entrada.success) {
    res.status(400).json({ mensaje: 'Revisa el correo y la contraseña' });
    return;
  }

  const { correo, password } = entrada.data;
  const token = await iniciarSesion(correo, password);

  // Respondo igual si la cuenta está inactiva, falta o la contraseña es incorrecta.
  if (!token) {
    res.status(401).json({ mensaje: 'Acceso inválido' });
    return;
  }

  res.set('Cache-Control', 'no-store').json({ token });
});

export async function consultarSesion(req: any, res: any) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ mensaje: 'Acceso no autorizado' });
    return;
  }

  // Revisa la firma y el vencimiento
  const payload = verificarToken(token);
  if (!payload) {
    res.status(401).json({ mensaje: 'Sesión inválida o expirada' });
    return;
  }

  // Revisa la cuenta activa y versionSesion
  const usuario = await obtenerSesion(payload.sub, payload.versionSesion);
  if (!usuario) {
    res.status(401).json({ mensaje: 'Sesión revocada o cuenta inactiva' });
    return;
  }

  res.status(200).json(usuario);
}

rutasAuth.get(['/session', '/sesion'], consultarSesion);



