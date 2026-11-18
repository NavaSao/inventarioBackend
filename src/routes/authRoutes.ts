import { Router, type RequestHandler } from 'express';
import type { crearAuthController } from '../controllers/AuthController.js';
import { validarLogin } from '../validators/authValidator.js';

export function crearRutasAuth(
  controller: ReturnType<typeof crearAuthController>,
  verificarBearer: RequestHandler
): Router {
  const rutas = Router();

  rutas.post('/login', validarLogin, controller.login);
  rutas.get(['/sesion', '/session'], verificarBearer, controller.consultarSesion);
  return rutas;
}
