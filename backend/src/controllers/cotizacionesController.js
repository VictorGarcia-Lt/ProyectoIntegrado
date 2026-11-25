// controllers/cotizacionesController.js
import pool, { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';

const ESTADOS_COTIZACION = ['Nueva', 'En revisión', 'Enviada', 'Aceptada', 'Rechazada'];
const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

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

    if (!ESTADOS_COTIZACION.includes(estado)) {
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

// PATCH /api/cotizaciones/:id/evaluar
// Evaluación económica: el margen y la rentabilidad se calculan siempre en servidor.
export async function evaluarCotizacion(req, res, next) {
  try {
    const id = Number(req.params.id);
    const {
      materiales_estimados = [],
      costo_mano_obra = 0,
      otros_costos = 0,
      precio_cotizado = 0,
      estado,
      notas_evaluacion = '',
    } = req.body || {};

    if (!Array.isArray(materiales_estimados)) {
      return res.status(400).json({ error: 'materiales_estimados debe ser un arreglo' });
    }
    if (estado !== undefined && !ESTADOS_COTIZACION.includes(estado)) {
      return res.status(400).json({ error: 'Estado de cotización no válido' });
    }

    const materiales = materiales_estimados
      .map((m) => ({
        repuesto_id: m.repuesto_id ?? null,
        nombre: String(m.nombre ?? '').trim(),
        cantidad: numero(m.cantidad),
        costo_unitario: numero(m.costo_unitario),
      }))
      .filter((m) => m.nombre || m.repuesto_id);

    const costoMateriales = materiales.reduce((suma, m) => suma + m.cantidad * m.costo_unitario, 0);
    const manoObra = numero(costo_mano_obra);
    const otros = numero(otros_costos);
    const precio = numero(precio_cotizado);

    const costoTotal = costoMateriales + manoObra + otros;
    const utilidadNeta = precio - costoTotal;
    const margen = precio > 0
      ? (utilidadNeta / precio) * 100
      : (costoTotal > 0 ? -100 : 0);
    const margenRedondeado = Number(margen.toFixed(2));
    const esRentable = margenRedondeado >= 20;

    const { rows } = await query(
      `UPDATE cotizaciones
       SET costo_materiales = $1,
           costo_mano_obra = $2,
           otros_costos = $3,
           precio_cotizado = $4,
           margen_porcentaje = $5,
           es_rentable = $6,
           materiales_estimados = $7,
           notas_evaluacion = $8,
           estado = COALESCE($9, estado)
       WHERE id = $10
       RETURNING *`,
      [
        Number(costoMateriales.toFixed(2)),
        manoObra,
        otros,
        precio,
        margenRedondeado,
        esRentable,
        JSON.stringify(materiales),
        String(notas_evaluacion || ''),
        estado ?? null,
        id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Evaluación de rentabilidad',
      detalle: `Cotización ${id} - margen ${margenRedondeado}% - ${esRentable ? 'rentable' : 'no rentable'}`,
    });

    res.json({
      ...rows[0],
      costo_total: Number(costoTotal.toFixed(2)),
      utilidad_neta: Number(utilidadNeta.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/cotizaciones/:id/convertir
// Transforma una cotización aceptada en una solicitud pendiente.
export async function convertirCotizacion(req, res, next) {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const { cliente_id, zona, urgencia = 'Normal' } = req.body || {};

    if (!['Urgente', 'Alta', 'Normal'].includes(urgencia)) {
      return res.status(400).json({ error: 'Urgencia no válida' });
    }

    const { rows: cotRows } = await query('SELECT * FROM cotizaciones WHERE id = $1', [id]);
    if (cotRows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    const cotizacion = cotRows[0];

    let cliente;
    if (cliente_id) {
      const { rows } = await query('SELECT id, nombre, zona FROM clientes WHERE id = $1', [cliente_id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      cliente = rows[0];
    } else {
      const { rows } = await query(
        'SELECT id, nombre, zona FROM clientes WHERE nombre ILIKE $1 ORDER BY id LIMIT 1',
        [cotizacion.empresa]
      );
      if (rows.length > 0) {
        cliente = rows[0];
      } else {
        if (!zona) {
          return res.status(400).json({ error: 'zona es obligatoria para crear el cliente de la cotización' });
        }
        const { rows: nuevos } = await query(
          'INSERT INTO clientes (nombre, rubro, zona) VALUES ($1, $2, $3) RETURNING id, nombre, zona',
          [cotizacion.empresa, cotizacion.rubro, zona]
        );
        cliente = nuevos[0];
      }
    }

    const zonaFinal = zona || cliente.zona;

    await client.query('BEGIN');
    const { rows: solicitudes } = await client.query(
      `INSERT INTO solicitudes (cliente_id, zona, urgencia, origen, estado, falla)
       VALUES ($1, $2, $3, 'Web (Cotización)', 'Pendiente', $4)
       RETURNING id, cliente_id, zona, urgencia, origen, estado, tec_id, falla, repuestos, observacion, firma, created_at`,
      [cliente.id, zonaFinal, urgencia, cotizacion.descripcion]
    );
    const solicitud = solicitudes[0];

    await client.query("UPDATE cotizaciones SET estado = 'Aceptada' WHERE id = $1", [id]);
    await client.query('COMMIT');

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Cotización convertida en orden',
      detalle: `Cotización ${id} -> solicitud ${solicitud.id} (cliente ${cliente.id})`,
    });

    return res.status(201).json({
      solicitud,
      cotizacion_id: id,
      codigo: 'COT-' + String(id).padStart(4, '0'),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}