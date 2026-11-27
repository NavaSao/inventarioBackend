import { Router } from 'express';
import {
  loginController,
  globalLogoutController,
  validateSessionController,
  authGuard,
} from '../../infrastructure/config/container.js';
import { loginSchema } from '../../application/auth/commands/login/LoginValidator.js';
import { validarBody } from '../middlewares/validarBody.js';

const router = Router();
const validateLogin = validarBody(loginSchema, 'Datos de inicio de sesión inválidos');

// Command (Escritura): Iniciar sesión con generación de JWT
router.post('/login', validateLogin, loginController.execute);

// Command (Escritura / HU02): Cierre de sesión global
router.post(['/logout-global', '/logout'], authGuard.handle, globalLogoutController.execute);

// Query (Lectura): Consultar estado de sesión activa
router.get(['/sesion', '/session'], authGuard.handle, validateSessionController.execute);

export default router;
