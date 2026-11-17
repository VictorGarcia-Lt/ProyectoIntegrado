// controllers/cotizacionesController.js
import { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';

// POST /api/cotizaciones (pública)
export async function postCotizacion(req, res, next) {
  try {
    const { empresa, correo, rubro, desc, acepta } = req.body;

    if (!empresa || !correo || !rubro || !desc || acepta !== true) {
      return res.status(400).json({ error: 'Datos incompletos o no aceptó el tratamiento de datos (Ley 19.628)' });
    }

    const { rows } = await query(
      `INSERT INTO cotizaciones (empresa, correo, rubro, descripcion, acepta, estado)
       VALUES ($1, $2, $3, $4, $5, 'Nueva')
       RETURNING id`,
      [empresa, correo, rubro, desc, true]
    );

    const id = rows[0].id;

    await registrarAuditoria({
      usuario: 'publico',
      accion: 'Cotización pública recibida',
      detalle: `COT-${String(id).padStart(4, '0')} - ${empresa}`,
    });

    res.status(201).json({ id, codigo: 'COT-' + String(id).padStart(4, '0') });
  } catch (error) {
    next(error);
  }
}

// GET /api/cotizaciones
export async function getCotizaciones(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM cotizaciones ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/cotizaciones/:id
export async function patchCotizacion(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    const estadosValidos = ['Nueva', 'En revisión', 'Enviada', 'Aceptada', 'Rechazada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado de cotización no válido' });
    }

    const { rows } = await query(
      'UPDATE cotizaciones SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Cambio de estado de cotización',
      detalle: `Cotización ${id} -> ${estado}`,
    });

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}