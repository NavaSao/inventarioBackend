import { Router } from 'express';
import {
  loginController,
  globalLogoutController,
  validateSessionController,
  authGuard,
} from '../../infrastructure/config/container.js';
import { validateLogin } from '../validators/authValidator.js';

const router = Router();

// Command (Escritura): Iniciar sesión con generación de JWT
router.post('/login', validateLogin, loginController.execute);

// Command (Escritura / HU02): Cierre de sesión global
router.post(['/logout-global', '/logout'], authGuard.handle, globalLogoutController.execute);

// Query (Lectura): Consultar estado de sesión activa
router.get(['/sesion', '/session'], authGuard.handle, validateSessionController.execute);

export default router;
