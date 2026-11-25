// controllers/repuestosController.js
// Catálogo de materiales/inventario y trazabilidad de consumo por orden.

import pool, { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';

// Compatibilidad con las claves antiguas del JSONB en solicitudes.repuestos.
const ALIASES = {
  'compresor 3hp': 'Compresor Hermético 3HP',
  'gas refrigerante r404a': 'Gas Refrigerante R404A',
  'controlador digital': 'Controlador Digital Full Gauge MT-512E',
};

const numero = (valor, defecto = 0) => {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : defecto;
};

// GET /api/repuestos
export async function getRepuestos(_req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM repuestos ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// POST /api/repuestos
export async function createRepuesto(req, res, next) {
  try {
    const { codigo, nombre, unidad = 'unidad', costo_unitario = 0, precio_venta = 0, stock = 0 } = req.body || {};

    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'codigo y nombre son obligatorios' });
    }

    const { rows: existentes } = await query('SELECT 1 FROM repuestos WHERE codigo = $1', [String(codigo).trim()]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'El código de repuesto ya existe' });
    }

    const { rows } = await query(
      `INSERT INTO repuestos (codigo, nombre, unidad, costo_unitario, precio_venta, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        String(codigo).trim(),
        String(nombre).trim(),
        String(unidad).trim() || 'unidad',
        numero(costo_unitario),
        numero(precio_venta),
        Math.floor(numero(stock)),
      ]
    );

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Creación de repuesto',
      detalle: `${rows[0].codigo} - ${rows[0].nombre}`,
    });

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El código de repuesto ya existe' });
    }
    next(error);
  }
}

// PATCH /api/repuestos/:id
export async function updateRepuesto(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { stock, costo_unitario, precio_venta } = req.body || {};

    const campos = [];
    const params = [];
    let idx = 1;

    if (stock !== undefined) {
      if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
        return res.status(400).json({ error: 'stock debe ser un entero >= 0' });
      }
      campos.push(`stock = $${idx++}`);
      params.push(Number(stock));
    }
    if (costo_unitario !== undefined) {
      campos.push(`costo_unitario = $${idx++}`);
      params.push(numero(costo_unitario));
    }
    if (precio_venta !== undefined) {
      campos.push(`precio_venta = $${idx++}`);
      params.push(numero(precio_venta));
    }

    if (campos.length === 0) {
      return res.status(400).json({ error: 'Envíe stock, costo_unitario o precio_venta' });
    }

    params.push(id);
    const { rows } = await query(
      `UPDATE repuestos SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Actualización de inventario',
      detalle: `Repuesto ${id} - ${campos.join(', ')}`,
    });

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Descuenta stock y deja trazabilidad al finalizar una orden.
// Idempotente: si la orden ya tiene detalle, no vuelve a descontar.
export async function registrarConsumoRepuestos({ solicitudId, repuestos, usuario }) {
  if (!repuestos || typeof repuestos !== 'object' || Array.isArray(repuestos)) {
    return { registrados: 0 };
  }

  const client = await pool.connect();
  let registrados = 0;

  try {
    await client.query('BEGIN');

    const { rows: previos } = await client.query(
      'SELECT 1 FROM orden_repuestos WHERE solicitud_id = $1 LIMIT 1',
      [solicitudId]
    );
    if (previos.length > 0) {
      await client.query('ROLLBACK');
      return { registrados: 0, ya_registrado: true };
    }

    for (const [clave, valor] of Object.entries(repuestos)) {
      const cantidad = Number(valor);
      if (!Number.isInteger(cantidad) || cantidad <= 0) continue;

      const nombre = ALIASES[String(clave).trim().toLowerCase()] || String(clave).trim();
      let { rows } = await client.query('SELECT id, nombre, costo_unitario FROM repuestos WHERE nombre = $1', [nombre]);
      if (rows.length === 0) {
        ({ rows } = await client.query('SELECT id, nombre, costo_unitario FROM repuestos WHERE LOWER(nombre) = LOWER($1)', [nombre]));
      }
      if (rows.length === 0) continue; // Repuesto legacy o fuera de catálogo: no descuenta stock.

      const repuesto = rows[0];
      const costoTotal = numero(repuesto.costo_unitario) * cantidad;

      await client.query('UPDATE repuestos SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [cantidad, repuesto.id]);
      await client.query(
        `INSERT INTO orden_repuestos (solicitud_id, repuesto_id, cantidad, costo_total)
         VALUES ($1, $2, $3, $4)`,
        [solicitudId, repuesto.id, cantidad, costoTotal]
      );
      registrados++;
    }

    await client.query('COMMIT');

    if (registrados > 0) {
      await registrarAuditoria({
        usuario: usuario || 'sistema',
        accion: 'Consumo de repuestos en orden finalizada',
        detalle: `Orden ${solicitudId} - ${registrados} repuesto(s) descontado(s) de inventario`,
      });
    }

    return { registrados };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    // El consumo no debe tumbar la finalización de la orden.
    console.error('No se pudo registrar consumo de repuestos:', error.message);
    return { registrados: 0 };
  } finally {
    client.release();
  }
}
