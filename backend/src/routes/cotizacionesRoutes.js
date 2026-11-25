// routes/cotizacionesRoutes.js
import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { permitirRoles } from '../middlewares/roles.js';
import {
  postCotizacion,
  getCotizaciones,
  patchCotizacion,
  evaluarCotizacion,
  convertirCotizacion,
} from '../controllers/cotizacionesController.js';

const router = Router();

// Ruta pública (sin JWT)
router.post('/', postCotizacion);

router.get('/', verificarToken, permitirRoles('ventas', 'encargado', 'admin'), getCotizaciones);
router.patch('/:id/evaluar', verificarToken, permitirRoles('ventas', 'encargado', 'admin'), evaluarCotizacion);
router.post('/:id/convertir', verificarToken, permitirRoles('ventas', 'encargado', 'admin'), convertirCotizacion);
router.patch('/:id', verificarToken, permitirRoles('ventas', 'admin'), patchCotizacion);

export default router;