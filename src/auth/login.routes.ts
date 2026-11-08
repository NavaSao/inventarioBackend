import { Router } from 'express';
import { iniciarSesion } from '../commands/auth/iniciarSesion.js';
import { credencialesSchema } from './credenciales.js';

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
