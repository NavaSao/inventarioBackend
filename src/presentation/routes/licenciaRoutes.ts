import { Router } from 'express';
import {
  authGuard,
  guardiaSesionActiva,
  registrarLicenciaController,
  listarLicenciasController,
  consultarLicenciaController,
  assignLicenseController,
  releaseLicenseController,
  previewLicenseAssignmentController,
  getLicenseHistoryController,
} from '../../infrastructure/config/container.js';

const router = Router();

router.use(authGuard.handle, guardiaSesionActiva);
router.post('/', registrarLicenciaController.execute);
router.get('/', listarLicenciasController.execute);
router.post('/asignaciones/:idAsignacionLicencia/liberar', releaseLicenseController.execute);
router.get('/:idLicencia/asignar/previsualizacion', previewLicenseAssignmentController.execute);
router.post('/:idLicencia/asignar', assignLicenseController.execute);
router.post('/:idLicencia/liberar', releaseLicenseController.execute);
router.get('/:idLicencia/historial', getLicenseHistoryController.execute);
router.get('/:idLicencia', consultarLicenciaController.execute);

export default router;
