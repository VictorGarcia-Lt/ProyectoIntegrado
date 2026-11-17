// routes/auditoriaRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import { getAuditoria } from '../controllers/auditoriaController.js';

const router = Router();

router.get('/', verificarToken, permitirRoles('encargado', 'admin'), getAuditoria);

export default router;