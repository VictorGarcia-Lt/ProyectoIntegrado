// routes/clientesRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import { getClientes, getHistorialCliente, postCliente } from '../controllers/clientesController.js';

const router = Router();

router.get('/', verificarToken, getClientes);
router.get('/:id/historial', verificarToken, getHistorialCliente);
router.post('/', verificarToken, permitirRoles('ventas', 'encargado', 'admin'), postCliente);

export default router;