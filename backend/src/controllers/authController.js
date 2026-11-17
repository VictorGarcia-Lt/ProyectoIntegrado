// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';
import { generarCodigoOTP, enviarCodigoPorCorreo } from '../services/securityService.js';

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, pass } = req.body;
    if (!email || !pass) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const { rows } = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = rows[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar bloqueo temporal
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      const segundosRestantes = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 1000);
      return res.status(423).json({ error: 'Cuenta bloqueada temporalmente por seguridad', segundosRestantes });
    }

    const passwordOk = await bcrypt.compare(pass, usuario.password_hash);

    if (!passwordOk) {
      const nuevosIntentos = (usuario.intentos_fallidos || 0) + 1;
      if (nuevosIntentos >= 3) {
        const bloqueadoHasta = new Date(Date.now() + 40 * 1000);
        await query(
          'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = $1 WHERE id = $2',
          [bloqueadoHasta, usuario.id]
        );
        await registrarAuditoria({ usuario: email, accion: 'Bloqueo de cuenta', detalle: '3 intentos fallidos consecutivos (40s)' });
        return res.status(423).json({ error: 'Cuenta bloqueada temporalmente por seguridad', segundosRestantes: 40 });
      }
      await query('UPDATE usuarios SET intentos_fallidos = $1 WHERE id = $2', [nuevosIntentos, usuario.id]);
      const restantes = 3 - nuevosIntentos;
      return res.status(401).json({ error: `Contraseña incorrecta. Te quedan ${restantes} intento(s).` });
    }

    // Credenciales válidas: limpiar intentos
    await query('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1', [usuario.id]);

    // Generar OTP real de 6 dígitos con expiración de 3 minutos
    const codigo = generarCodigoOTP();
    const expira = new Date(Date.now() + 3 * 60 * 1000);
    await query('UPDATE usuarios SET otp_codigo = $1, otp_expira_en = $2 WHERE id = $3', [codigo, expira, usuario.id]);

    const envio = await enviarCodigoPorCorreo(usuario.correo, codigo);

    const tempToken = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_TEMP_SECRET,
      { expiresIn: '5m' }
    );

    await registrarAuditoria({ usuario: email, accion: 'Inicio de sesión (OTP enviado)' });

    const respuesta = { requiere2FA: true, tempToken, correo: usuario.correo };
    if (!envio.enviadoPorCorreo && envio.codigoDemo) {
      respuesta.codigoPreview = envio.codigoDemo;
    }
    return res.json(respuesta);
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/2fa
export async function verificar2FA(req, res, next) {
  try {
    const { code } = req.body;
    const tempUser = req.tempUser;

    const { rows } = await query('SELECT * FROM usuarios WHERE id = $1', [tempUser.id]);
    const usuario = rows[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    if (!usuario.otp_codigo || !usuario.otp_expira_en) {
      return res.status(401).json({ error: 'Código inválido o expirado' });
    }

    if (usuario.otp_codigo !== String(code) || new Date(usuario.otp_expira_en) <= new Date()) {
      return res.status(401).json({ error: 'Código inválido o expirado' });
    }

    // Limpiar OTP (uso único)
    await query('UPDATE usuarios SET otp_codigo = NULL, otp_expira_en = NULL WHERE id = $1', [usuario.id]);

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol, tecId: usuario.tec_id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    await registrarAuditoria({ usuario: usuario.email, accion: 'Inicio de sesión con 2FA (OTP válido)' });

    return res.json({
      token,
      user: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol, tecId: usuario.tec_id },
    });
  } catch (error) {
    next(error);
  }
}