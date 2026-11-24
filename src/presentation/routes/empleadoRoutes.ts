import { Router } from 'express';
import {
  authGuard,
  guardiaSesionActiva,
  registrarEmpleadoController,
  listarEmpleadosController,
  editarEmpleadoController,
  desactivarEmpleadoController,
} from '../../infrastructure/config/container.js';

const router = Router();

router.use(authGuard.handle, guardiaSesionActiva);

router.post('/', registrarEmpleadoController.execute);
router.get('/', listarEmpleadosController.execute);
router.put('/:id', editarEmpleadoController.execute);
router.patch('/:id/desactivar', desactivarEmpleadoController.execute);

export default router;
