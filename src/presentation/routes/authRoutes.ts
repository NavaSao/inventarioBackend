import { Router } from 'express';
import { authController, authMiddleware } from '../../infrastructure/config/container.js';
import { validateLogin } from '../validators/authValidator.js';

const router = Router();

// Command (Escritura): Iniciar sesión
router.post('/login', validateLogin, authController.login);

// Query (Lectura): Consultar estado de sesión activa
router.get(['/sesion', '/session'], authMiddleware, authController.consultarSesion);

export default router;
