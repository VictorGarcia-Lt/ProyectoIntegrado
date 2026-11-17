// middlewares/roles.js
// Middleware de autorización por roles (denegar por defecto).

import { registrarAuditoria } from '../utils/audit.js';

// Uso: permitirRoles('encargado', 'admin')
export function permitirRoles(...rolesPermitidos) {
  return async (req, res, next) => {
    const rol = req.user?.rol;

    if (!rol || !rolesPermitidos.includes(rol)) {
      // Registra el intento no autorizado en la bitácora.
      try {
        await registrarAuditoria({
          usuario: req.user?.email || 'anonimo',
          accion: 'Acceso denegado',
          detalle: `Ruta ${req.method} ${req.originalUrl} - rol ${rol || 'sin rol'}`,
        });
      } catch (e) {
        // No interrumpir la respuesta por un fallo de auditoría.
      }
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }

    next();
  };
}