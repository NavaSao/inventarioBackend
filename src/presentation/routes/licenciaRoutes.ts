import { Router } from 'express';
import {
  authGuard,
  guardiaSesionActiva,
  registrarLicenciaController,
  listarLicenciasController,
  consultarLicenciaController,
} from '../../infrastructure/config/container.js';

const router = Router();

router.use(authGuard.handle, guardiaSesionActiva);
router.post('/', registrarLicenciaController.execute);
router.get('/', listarLicenciasController.execute);
router.get('/:idLicencia', consultarLicenciaController.execute);

export default router;
