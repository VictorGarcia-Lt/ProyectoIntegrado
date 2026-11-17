// middlewares/auth.js
// Middlewares de autenticación basados en JWT.

import jwt from 'jsonwebtoken';

// Verifica el JWT definitivo enviado en la cabecera Authorization: Bearer <token>.
// Si es válido, adjunta req.user = { id, email, nombre, rol, tecId }.
export function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token no proporcionado o formato inválido' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
      tecId: payload.tecId || null,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Verifica el token temporal emitido durante el paso 1 del login (2FA).
// Exclusivo para la ruta POST /api/auth/2fa.
export function verificarTokenTemp(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token temporal no proporcionado' });
    }

    const payload = jwt.verify(token, process.env.JWT_TEMP_SECRET);
    // El token temporal solo debe contener el id del usuario pendiente.
    req.tempUser = { id: payload.id, email: payload.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token temporal inválido o expirado' });
  }
}