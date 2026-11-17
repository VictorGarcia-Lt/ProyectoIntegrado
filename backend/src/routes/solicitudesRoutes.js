// routes/solicitudesRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import { getSolicitudes, postSolicitud, patchAsignar } from '../controllers/solicitudesController.js';

const router = Router();

router.get('/', verificarToken, getSolicitudes);
router.post('/', verificarToken, permitirRoles('ventas', 'encargado', 'admin'), postSolicitud);
router.patch('/:id/asignar', verificarToken, permitirRoles('encargado', 'admin'), patchAsignar);

export default router;