// routes/reportesRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import { getResumen } from '../controllers/reportesController.js';

const router = Router();

router.get('/resumen', verificarToken, permitirRoles('ventas', 'encargado', 'admin'), getResumen);

export default router;