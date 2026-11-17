// routes/ordenesRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import upload from '../middlewares/upload.js';
import { getMisOrdenes, patchOrden, postAdjunto, syncOrdenes } from '../controllers/ordenesController.js';

const router = Router();

router.get('/mias', verificarToken, permitirRoles('tecnico', 'encargado', 'admin'), getMisOrdenes);
router.patch('/:id', verificarToken, permitirRoles('tecnico', 'encargado', 'admin'), patchOrden);
router.post('/:id/adjuntos', verificarToken, upload.single('archivo'), postAdjunto);
router.post('/sync', verificarToken, permitirRoles('tecnico'), syncOrdenes);

export default router;