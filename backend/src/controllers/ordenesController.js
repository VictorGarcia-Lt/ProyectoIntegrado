// controllers/ordenesController.js
// Gestión de órdenes de trabajo en terreno (actualización, adjuntos, sync offline).

import { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';
import { registrarConsumoRepuestos } from './repuestosController.js';

// GET /api/ordenes/mias
export async function getMisOrdenes(req, res, next) {
  try {
    let sql;
    let params = [];

    if (req.user.rol === 'tecnico') {
      sql = `
        SELECT s.id, s.cliente_id, s.zona, s.urgencia, s.origen, s.estado, s.tec_id, s.falla,
               s.repuestos, s.observacion, s.firma, s.created_at, c.nombre AS cliente_nombre
        FROM solicitudes s
        JOIN clientes c ON c.id = s.cliente_id
        WHERE s.tec_id = $1 AND s.estado IN ('Asignada','En proceso','Finalizado')
        ORDER BY CASE s.urgencia WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 ELSE 3 END, s.id DESC
      `;
      params = [req.user.tecId];
    } else {
      sql = `
        SELECT s.id, s.cliente_id, s.zona, s.urgencia, s.origen, s.estado, s.tec_id, s.falla,
               s.repuestos, s.observacion, s.firma, s.created_at, c.nombre AS cliente_nombre
        FROM solicitudes s
        JOIN clientes c ON c.id = s.cliente_id
        WHERE s.estado IN ('Asignada','En proceso','Finalizado')
        ORDER BY CASE s.urgencia WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 ELSE 3 END, s.id DESC
      `;
    }

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/ordenes/:id
export async function patchOrden(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { estado, repuestos, observacion } = req.body;

    // Verificar existencia y propiedad
    const { rows: existentes } = await query(
      'SELECT id, cliente_id, tec_id FROM solicitudes WHERE id = $1',
      [id]
    );
    if (existentes.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    const orden = existentes[0];

    // Regla de propiedad (OWASP A01)
    if (req.user.rol === 'tecnico' && orden.tec_id !== req.user.tecId) {
      await registrarAuditoria({
        usuario: req.user.email,
        accion: 'Acceso denegado',
        detalle: `Intento de modificar orden ${id} que no le pertenece`,
      });
      return res.status(403).json({ error: 'No tiene permisos para modificar esta orden' });
    }

    // Validación obligatoria para finalizar
    if (estado === 'Finalizado' && (!observacion || !observacion.trim())) {
      return res.status(400).json({ error: 'La observación es obligatoria para finalizar la orden' });
    }

    // Construir actualización dinámica
    const campos = [];
    const params = [];
    let idx = 1;

    if (estado) {
      campos.push(`estado = $${idx++}`);
      params.push(estado);
    }
    if (repuestos !== undefined) {
      campos.push(`repuestos = $${idx++}`);
      params.push(repuestos);
    }
    if (observacion !== undefined) {
      campos.push(`observacion = $${idx++}`);
      params.push(observacion);
    }
    campos.push('updated_at = NOW()');

    if (campos.length === 1) {
      return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
    }

    params.push(id);
    const sql = `UPDATE solicitudes SET ${campos.join(', ')} WHERE id = $${idx} RETURNING id, cliente_id, zona, urgencia, origen, estado, tec_id, falla, repuestos, observacion, firma`;
    const { rows } = await query(sql, params);
    const actualizada = rows[0];

    // Si pasa a Finalizado: descontar inventario y registrar en historial del cliente
    if (estado === 'Finalizado') {
      await registrarConsumoRepuestos({
        solicitudId: id,
        repuestos: repuestos !== undefined ? repuestos : actualizada.repuestos,
        usuario: req.user.email,
      });
      const resumen = `Orden ${id} finalizada. Obs: ${observacion || ''}. Repuestos: ${JSON.stringify(repuestos || actualizada.repuestos || {})}`;
      await query(
        `INSERT INTO historial (cliente_id, fecha, tipo, descripcion) VALUES ($1, CURRENT_DATE, $2, $3)`,
        [orden.cliente_id, 'Orden finalizada', resumen]
      );

      await registrarAuditoria({
        usuario: req.user.email,
        accion: 'Finalización de orden',
        detalle: `Orden ${id} finalizada por ${req.user.email}`,
      });
    } else {
      await registrarAuditoria({
        usuario: req.user.email,
        accion: 'Actualización de orden',
        detalle: `Orden ${id} -> estado ${estado || 'sin cambio'}`,
      });
    }

    res.json(actualizada);
  } catch (error) {
    next(error);
  }
}

// POST /api/ordenes/:id/adjuntos
export async function postAdjunto(req, res, next) {
  try {
    const id = Number(req.params.id);
    const tipo = req.body.tipo || 'foto';

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const ruta = `/uploads/${req.file.filename}`;

    await query(
      'INSERT INTO adjuntos (solicitud_id, tipo, ruta) VALUES ($1, $2, $3)',
      [id, tipo, ruta]
    );

    if (tipo === 'firma') {
      await query('UPDATE solicitudes SET firma = TRUE WHERE id = $1', [id]);
    }

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Adjunto subido',
      detalle: `Orden ${id} - tipo ${tipo} - ${ruta}`,
    });

    res.status(201).json({ ruta, tipo });
  } catch (error) {
    next(error);
  }
}

// POST /api/ordenes/sync
export async function syncOrdenes(req, res, next) {
  try {
    const cambios = req.body.cambios || [];
    let sincronizados = 0;

    for (const item of cambios) {
      // Idempotencia: si ya se procesó este uuid, omitir
      if (item.uuid) {
        const { rows } = await query(
          "SELECT 1 FROM auditoria WHERE accion LIKE $1 LIMIT 1",
          [`%sync:${item.uuid}%`]
        );
        if (rows.length > 0) {
          continue;
        }
      }

      const id = item.id;
      const cambio = item.cambio || {};

      const campos = [];
      const params = [];
      let idx = 1;

      if (cambio.estado) {
        campos.push(`estado = $${idx++}`);
        params.push(cambio.estado);
      }
      if (cambio.repuestos !== undefined) {
        campos.push(`repuestos = $${idx++}`);
        params.push(cambio.repuestos);
      }
      if (cambio.obs !== undefined) {
        campos.push(`observacion = $${idx++}`);
        params.push(cambio.obs);
      }
      campos.push('updated_at = NOW()');

      if (campos.length > 1) {
        params.push(id);
        await query(
          `UPDATE solicitudes SET ${campos.join(', ')} WHERE id = $${idx}`,
          params
        );
        if (cambio.estado === 'Finalizado') {
          await registrarConsumoRepuestos({
            solicitudId: id,
            repuestos: cambio.repuestos,
            usuario: req.user.email,
          });
        }
      }

      await registrarAuditoria({
        usuario: req.user.email,
        accion: `Sync offline${item.uuid ? ' sync:' + item.uuid : ''}`,
        detalle: `Orden ${id} sincronizada`,
      });

      sincronizados++;
    }

    res.json({ sincronizados });
  } catch (error) {
    next(error);
  }
}