import { Router } from 'express';
import { authGuard, guardiaSesionActiva, getDashboardController } from '../../infrastructure/config/container.js';

const router = Router();

router.use(authGuard.handle, guardiaSesionActiva);
router.get('/', getDashboardController.execute);

export default router;
