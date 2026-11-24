import { Router } from 'express';
import {
  authGuard,
  guardiaSesionActiva,
  dashboardController,
} from '../../infrastructure/config/container.js';

const router = Router();

// Endpoint privado protegido con AuthGuard y validación de sesión activa
router.use(authGuard.handle, guardiaSesionActiva);
router.get('/', dashboardController.execute);

export default router;
