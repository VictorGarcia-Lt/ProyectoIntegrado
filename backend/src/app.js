// app.js
// Configuración central de Express: middlewares globales, archivos estáticos
// y montaje de las rutas bajo /api/...

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas (los archivos se implementan en pasos posteriores)
import authRoutes from './routes/authRoutes.js';
import tecnicosRoutes from './routes/tecnicosRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';
import solicitudesRoutes from './routes/solicitudesRoutes.js';
import ordenesRoutes from './routes/ordenesRoutes.js';
import cotizacionesRoutes from './routes/cotizacionesRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';
import auditoriaRoutes from './routes/auditoriaRoutes.js';

// Middleware de errores (se implementa en Paso 3)
import errorHandler from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Seguridad básica de cabeceras HTTP
app.use(helmet());

// CORS: permite al frontend (configurado en .env) consumir la API
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Parseo de JSON en el body
app.use(express.json());

// Carpeta pública para archivos subidos (firmas, fotos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Montaje de rutas
app.use('/api/auth', authRoutes);
app.use('/api/tecnicos', tecnicosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Ruta de salud (health check)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mensaje: 'API JG Frío operativa' });
});

// Manejo centralizado de errores (debe ir al final)
app.use(errorHandler);

export default app;