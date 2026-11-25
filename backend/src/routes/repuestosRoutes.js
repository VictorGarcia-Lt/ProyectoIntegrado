// routes/repuestosRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import { getRepuestos, createRepuesto, updateRepuesto } from '../controllers/repuestosController.js';

const router = Router();

// Lectura disponible para cualquier usuario autenticado (oficina y técnicos).
router.get('/', verificarToken, getRepuestos);
router.post('/', verificarToken, permitirRoles('encargado', 'admin', 'ventas'), createRepuesto);
router.patch('/:id', verificarToken, permitirRoles('encargado', 'admin', 'ventas'), updateRepuesto);

export default router;
