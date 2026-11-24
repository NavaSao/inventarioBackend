import { Router } from 'express';
import {
  authGuard,
  guardiaSesionActiva,
  registrarEmpleadoController,
  listarEmpleadosController,
  editarEmpleadoController,
  desactivarEmpleadoController,
  searchEmployeesController,
  searchEmployeesSelectorController,
} from '../../infrastructure/config/container.js';

const router = Router();

router.use(authGuard.handle, guardiaSesionActiva);

router.post('/', registrarEmpleadoController.execute);
router.get('/', listarEmpleadosController.execute);
router.get('/buscar', searchEmployeesController.execute);
router.get('/selector', searchEmployeesSelectorController.execute);
router.put('/:id', editarEmpleadoController.execute);
router.patch('/:id/desactivar', desactivarEmpleadoController.execute);

export default router;
