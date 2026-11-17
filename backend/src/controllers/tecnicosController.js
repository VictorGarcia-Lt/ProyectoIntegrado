// controllers/tecnicosController.js
import { query } from '../config/db.js';
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