// utils/audit.js
// Función para registrar acciones en la tabla auditoria.
// Nunca debe tumbar la operación principal: captura errores internos.

import { query } from '../config/db.js';

// registrarAuditoria({ usuario, accion, detalle })
// - usuario: email o identificador del actor
// - accion: descripción corta de la acción
// - detalle: información adicional (opcional)
export async function registrarAuditoria({ usuario, accion, detalle }) {
  try {
    const accionFinal = detalle ? `${accion} - ${detalle}` : accion;
    await query(
      'INSERT INTO auditoria (usuario, accion) VALUES ($1, $2)',
      [usuario || 'sistema', accionFinal]
    );
  } catch (error) {
    // Un fallo al escribir en la bitácora no debe romper la operación principal.
    console.error('No se pudo registrar auditoría:', error.message);
  }
}

export default registrarAuditoria;