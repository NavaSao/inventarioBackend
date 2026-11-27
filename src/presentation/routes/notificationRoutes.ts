import { Router } from 'express';
import {
  authGuard,
  guardiaSesionActiva,
  notificationController,
} from '../../infrastructure/config/container.js';
import { assignmentNoticeSchema } from '../../application/notifications/commands/aviso-asignacion/SendAssignmentNoticeValidator.js';
import { testEmailSchema } from '../../application/notifications/commands/correo-prueba/TestEmailValidator.js';
import { welcomeEmailSchema } from '../../application/notifications/commands/correo-bienvenida/SendWelcomeEmailValidator.js';
import { validarBody } from '../middlewares/validarBody.js';

const router = Router();
const validateWelcomeEmail = validarBody(welcomeEmailSchema, 'Datos inválidos para el correo de bienvenida (HU03)');
const validateAssignmentNotice = validarBody(assignmentNoticeSchema, 'Datos inválidos para el aviso de asignación (HU06)');
const validateTestEmail = validarBody(testEmailSchema, 'Datos inválidos para el envío de correo de prueba');

// Todas las rutas de notificaciones requieren JWT válido y sesión activa no revocada (HU02)
router.use(authGuard.handle, guardiaSesionActiva);

// Command (HU03): Envío de correo de bienvenida opcional
router.post('/bienvenida', validateWelcomeEmail, notificationController.enviarBienvenida);

// Command (HU06): Envío automático de aviso al asignar activo o licencia
router.post('/asignacion', validateAssignmentNotice, notificationController.enviarAvisoAsignacion);

// Command (Diagnóstico): Envío de prueba hacia una cuenta de correo de verificación
router.post('/prueba', validateTestEmail, notificationController.probarEnvio);

export default router;
