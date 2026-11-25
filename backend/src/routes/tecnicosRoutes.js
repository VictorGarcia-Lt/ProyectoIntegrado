// routes/tecnicosRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import { getTecnicos, createTecnico, patchDisponibilidad } from '../controllers/tecnicosController.js';

const router = Router();

router.get('/', verificarToken, getTecnicos);
router.post('/', verificarToken, permitirRoles('encargado', 'admin'), createTecnico);
router.patch('/:id/disponibilidad', verificarToken, patchDisponibilidad);

export default router;