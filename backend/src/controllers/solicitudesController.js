// controllers/solicitudesController.js
import { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';

// GET /api/solicitudes
export async function getSolicitudes(req, res, next) {
  try {
    const { estado, zona, urg, q } = req.query;

    const condiciones = [];
    const params = [];
    let idx = 1;

    if (estado) {
      condiciones.push(`s.estado = $${idx++}`);
      params.push(estado);
    }
    if (zona) {
      condiciones.push(`s.zona = $${idx++}`);
      params.push(zona);
    }
    if (urg) {
      condiciones.push(`s.urgencia = $${idx++}`);
      params.push(urg);
    }
    if (q) {
      condiciones.push(`(c.nombre ILIKE $${idx} OR s.falla ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const sql = `
      SELECT s.id, s.cliente_id, s.zona, s.urgencia, s.origen, s.estado, s.tec_id, s.falla,
             s.repuestos, s.materiales_presupuestados, s.observacion, s.firma, s.created_at,
             c.nombre AS cliente_nombre
      FROM solicitudes s
      JOIN clientes c ON c.id = s.cliente_id
      ${where}
      ORDER BY CASE s.urgencia WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 ELSE 3 END, s.id DESC
    `;

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// POST /api/solicitudes
export async function postSolicitud(req, res, next) {
  try {
    const body = req.body || {};
    const clienteId = body.cliente_id || body.cli;
    const origen = body.origen;
    const urgencia = body.urgencia || body.urg || 'Normal';
    const falla = body.falla || '';
    // zona se deriva del cliente si no viene
    let zona = body.zona;

    if (!clienteId || !origen) {
      return res.status(400).json({ error: 'cliente_id (cli) y origen son obligatorios' });
    }

    if (!zona) {
      const { rows } = await query('SELECT zona FROM clientes WHERE id = $1', [clienteId]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      zona = rows[0].zona;
    }

    const { rows } = await query(
      `INSERT INTO solicitudes (cliente_id, zona, urgencia, origen, estado, falla)
       VALUES ($1, $2, $3, $4, 'Pendiente', $5)
       RETURNING id, cliente_id, zona, urgencia, origen, estado, tec_id, falla, repuestos, observacion, firma, created_at`,
      [clienteId, zona, urgencia, origen, falla]
    );

    const nueva = rows[0];

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Creación de solicitud',
      detalle: `Solicitud ${nueva.id} para cliente ${clienteId}`,
    });

    res.status(201).json(nueva);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/solicitudes/:id/asignar
export async function patchAsignar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const tecId = req.body.tec_id || req.body.tecId;

    if (!tecId) {
      return res.status(400).json({ error: 'tec_id es obligatorio' });
    }

    // Validar que el técnico exista y esté disponible (409 si está ocupado).
    const { rows: tecRows } = await query('SELECT disponible, zona FROM tecnicos WHERE id = $1', [tecId]);
    if (tecRows.length === 0) {
      return res.status(404).json({ error: 'Técnico no encontrado' });
    }
    if (!tecRows[0].disponible) {
      return res.status(409).json({ error: 'El técnico seleccionado no está disponible' });
    }

    const { rows } = await query(
      `UPDATE solicitudes
       SET tec_id = $1, estado = 'Asignada', updated_at = NOW()
       WHERE id = $2
       RETURNING id, cliente_id, zona, urgencia, origen, estado, tec_id, falla`,
      [tecId, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const asignada = rows[0];
    const fueraDeZona = asignada.zona !== tecRows[0].zona;

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Asignación de técnico',
      detalle: `Solicitud ${id} asignada a técnico ${tecId}${fueraDeZona ? ' (fuera de zona)' : ''}`,
    });

    res.json({
      ...asignada,
      fuera_de_zona: fueraDeZona,
      zona_solicitud: asignada.zona,
      zona_tecnico: tecRows[0].zona,
    });
  } catch (error) {
    next(error);
  }
}