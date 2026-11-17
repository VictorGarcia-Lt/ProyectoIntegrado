// controllers/auditoriaController.js
import { query } from '../config/db.js';

// GET /api/auditoria
export async function getAuditoria(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT id, fecha, usuario, accion FROM auditoria ORDER BY id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}