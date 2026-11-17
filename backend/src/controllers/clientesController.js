// controllers/clientesController.js
import { query } from '../config/db.js';
import { registrarAuditoria } from '../utils/audit.js';

// GET /api/clientes
export async function getClientes(req, res, next) {
  try {
    const sql = `
      SELECT c.id, c.nombre, c.rubro, c.zona,
             (SELECT COUNT(*)::int FROM instalaciones i WHERE i.cliente_id = c.id) AS total_instalaciones,
             COALESCE(
               (SELECT json_agg(json_build_object('id', i.id, 'equipo', i.equipo, 'ubicacion', i.ubicacion))
                FROM instalaciones i WHERE i.cliente_id = c.id),
               '[]'::json
             ) AS instalaciones,
             EXISTS (
               SELECT 1 FROM historial h
               WHERE h.cliente_id = c.id
                 AND h.tipo = 'Compresor'
                 AND h.fecha >= CURRENT_DATE - INTERVAL '6 months'
               GROUP BY h.cliente_id
               HAVING COUNT(*) >= 3
             ) AS alerta_preventiva
      FROM clientes c
      ORDER BY c.id ASC
    `;
    const { rows } = await query(sql);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// GET /api/clientes/:id/historial
export async function getHistorialCliente(req, res, next) {
  try {
    const id = Number(req.params.id);

    const { rows: clienteRows } = await query(
      `SELECT c.id, c.nombre, c.rubro, c.zona,
              COALESCE(
                (SELECT json_agg(json_build_object('id', i.id, 'equipo', i.equipo, 'ubicacion', i.ubicacion))
                 FROM instalaciones i WHERE i.cliente_id = c.id),
                '[]'::json
              ) AS instalaciones
       FROM clientes c WHERE c.id = $1`,
      [id]
    );

    if (clienteRows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { rows: histRows } = await query(
      `SELECT id, fecha, tipo, descripcion
       FROM historial
       WHERE cliente_id = $1
       ORDER BY fecha DESC`,
      [id]
    );

    res.json({ ...clienteRows[0], historial: histRows });
  } catch (error) {
    next(error);
  }
}

// POST /api/clientes
export async function postCliente(req, res, next) {
  try {
    const { nombre, rubro, zona, equipo, ubicacion } = req.body;

    if (!nombre || !rubro || !zona || !equipo) {
      return res.status(400).json({ error: 'nombre, rubro, zona y equipo son obligatorios' });
    }

    const { rows: clienteRows } = await query(
      'INSERT INTO clientes (nombre, rubro, zona) VALUES ($1, $2, $3) RETURNING id, nombre, rubro, zona',
      [nombre, rubro, zona]
    );
    const cliente = clienteRows[0];

    const { rows: instRows } = await query(
      'INSERT INTO instalaciones (cliente_id, equipo, ubicacion) VALUES ($1, $2, $3) RETURNING id, equipo, ubicacion',
      [cliente.id, equipo, ubicacion || null]
    );

    await registrarAuditoria({
      usuario: req.user.email,
      accion: 'Creación de cliente',
      detalle: `Cliente ${cliente.id} - ${cliente.nombre}`,
    });

    res.status(201).json({ ...cliente, instalaciones: instRows });
  } catch (error) {
    next(error);
  }
}