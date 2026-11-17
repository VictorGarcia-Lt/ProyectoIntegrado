// controllers/reportesController.js
import { query } from '../config/db.js';

// GET /api/reportes/resumen
export async function getResumen(req, res, next) {
  try {
    const { rows: porEstado } = await query(
      'SELECT estado, COUNT(*)::int AS total FROM solicitudes GROUP BY estado ORDER BY estado'
    );

    const { rows: urgentesRows } = await query(
      "SELECT COUNT(*)::int AS total FROM solicitudes WHERE urgencia = 'Urgente' AND estado <> 'Finalizado'"
    );

    const { rows: tecnicosRows } = await query(
      'SELECT COUNT(*)::int AS total FROM tecnicos WHERE disponible = TRUE'
    );

    const { rows: porTecnico } = await query(
      `SELECT t.id, t.nombre,
              COUNT(s.id)::int AS finalizadas
       FROM tecnicos t
       LEFT JOIN solicitudes s ON s.tec_id = t.id AND s.estado = 'Finalizado'
       GROUP BY t.id, t.nombre
       ORDER BY t.id ASC`
    );

    res.json({
      por_estado: porEstado,
      urgentes_activas: urgentesRows[0]?.total || 0,
      tecnicos_disponibles: tecnicosRows[0]?.total || 0,
      por_tecnico: porTecnico,
    });
  } catch (error) {
    next(error);
  }
}