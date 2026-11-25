// controllers/tecnicosController.js
import bcrypt from 'bcryptjs';
import pool, { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';

// GET /api/tecnicos
export async function getTecnicos(req, res, next) {
  try {
    const sql = `
      SELECT t.id, t.nombre, t.zona, t.especialidad, t.disponible, t.nota,
             (SELECT COUNT(*)::int FROM solicitudes s
              WHERE s.tec_id = t.id AND s.estado IN ('Asignada','En proceso')) AS ordenes_activas
      FROM tecnicos t
      ORDER BY t.disponible DESC, t.nombre ASC
    `;
    const { rows } = await query(sql);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/tecnicos/:id/disponibilidad
export async function patchDisponibilidad(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { disponible, nota } = req.body;

    // Regla de propiedad: un técnico solo cambia su propia disponibilidad
    if (req.user.rol === 'tecnico' && req.user.tecId !== id) {
      return res.status(403).json({ error: 'Solo puede modificar su propia disponibilidad' });
    }

    const { rows } = await query(
      `UPDATE tecnicos
       SET disponible = COALESCE($1, disponible),
           nota = COALESCE($2, nota)
       WHERE id = $3
       RETURNING id, nombre, zona, especialidad, disponible, nota`,
      [typeof disponible === 'boolean' ? disponible : null, nota ?? null, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Técnico no encontrado' });
    }

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Cambio de disponibilidad',
      detalle: `Técnico ${id} -> disponible=${rows[0].disponible}, nota="${rows[0].nota}"`,
    });

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// POST /api/tecnicos
// Crea un técnico y su usuario de acceso en una sola transacción.
export async function createTecnico(req, res, next) {
  const client = await pool.connect();
  try {
    const { nombre, email, password, zona, especialidad, nota = '' } = req.body || {};

    if (!nombre || !email || !password || !zona || !especialidad) {
      return res.status(400).json({ error: 'nombre, email, password, zona y especialidad son obligatorios' });
    }

    const correo = String(email).trim().toLowerCase();
    const { rows: existentes } = await query('SELECT 1 FROM usuarios WHERE email = $1', [correo]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado en usuarios' });
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO tecnicos (nombre, zona, especialidad, disponible, nota)
       VALUES ($1, $2, $3, TRUE, $4)
       RETURNING id, nombre, zona, especialidad, disponible, nota, created_at`,
      [nombre, zona, especialidad, nota]
    );
    const tecnico = rows[0];

    const passwordHash = await bcrypt.hash(String(password), 10);
    await client.query(
      `INSERT INTO usuarios (email, password_hash, nombre, rol, dos_fa, tec_id)
       VALUES ($1, $2, $3, 'tecnico', TRUE, $4)`,
      [correo, passwordHash, nombre, tecnico.id]
    );

    await client.query('COMMIT');

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Creación de técnico',
      detalle: `Técnico ${tecnico.id} (${correo}) - ${nombre}`,
    });

    return res.status(201).json({ ...tecnico, ordenes_activas: 0 });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo ya está registrado en usuarios' });
    }
    next(error);
  } finally {
    client.release();
  }
}