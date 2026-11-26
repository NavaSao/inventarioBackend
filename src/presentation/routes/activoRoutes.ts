import express, { Router } from 'express';
import {
  asignarActivoController,
  authGuard,
  cerrarMantenimientoController,
  consultarActivoController,
  devolverActivoController,
  editarActivoController,
  escanearActivoController,
  guardiaSesionActiva,
  iniciarMantenimientoController,
  listarActivosController,
  registrarActivoController,
  subirFotoActivoController,
} from '../../infrastructure/config/container.js';

const router = Router();

router.use(authGuard.handle, guardiaSesionActiva);
router.get('/', listarActivosController.execute);
router.post('/', registrarActivoController.execute);
router.get('/etiqueta/:etiqueta', escanearActivoController.execute);
router.get('/:idActivo', consultarActivoController.execute);
router.put('/:idActivo', editarActivoController.execute);
router.put('/:idActivo/foto', express.text({ type: 'text/plain', limit: '4mb' }), subirFotoActivoController.execute);
router.post('/:idActivo/asignar', asignarActivoController.execute);
router.post('/:idActivo/devolver', devolverActivoController.execute);
router.post('/:idActivo/mantenimiento', iniciarMantenimientoController.execute);
router.post('/:idActivo/mantenimiento/cerrar', cerrarMantenimientoController.execute);

export default router;
