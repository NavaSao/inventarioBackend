import { Router } from 'express';
import {
  authGuard,
  guardiaSesionActiva,
  notificationController,
} from '../../infrastructure/config/container.js';
import {
  validateAssignmentNotice,
  validateTestEmail,
  validateWelcomeEmail,
} from '../validators/notificationValidator.js';

const router = Router();

// Todas las rutas de notificaciones requieren JWT válido y sesión activa no revocada (HU02)
router.use(authGuard.handle, guardiaSesionActiva);

// Command (HU03): Envío de correo de bienvenida opcional
router.post('/bienvenida', validateWelcomeEmail, notificationController.enviarBienvenida);

// Command (HU06): Envío automático de aviso al asignar activo o licencia
router.post('/asignacion', validateAssignmentNotice, notificationController.enviarAvisoAsignacion);

// Command (Diagnóstico): Envío de prueba hacia una cuenta de correo de verificación
router.post('/prueba', validateTestEmail, notificationController.probarEnvio);

export default router;
