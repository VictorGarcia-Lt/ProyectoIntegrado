// routes/authRoutes.js
import { Router } from 'express';
import { login, verificar2FA } from '../controllers/authController.js';
import { verificarTokenTemp } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/2fa', verificarTokenTemp, verificar2FA);

export default router;