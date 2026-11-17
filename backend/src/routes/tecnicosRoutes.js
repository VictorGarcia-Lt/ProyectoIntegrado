// routes/tecnicosRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { getTecnicos, patchDisponibilidad } from '../controllers/tecnicosController.js';

const router = Router();

router.get('/', verificarToken, getTecnicos);
router.patch('/:id/disponibilidad', verificarToken, patchDisponibilidad);

export default router;