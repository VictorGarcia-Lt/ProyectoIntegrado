// services/gestionService.js
import { apiFetch } from './api.js';

export async function enviarCotizacionPublica(datos) {
  return apiFetch('/cotizaciones', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function getCotizaciones() {
  return apiFetch('/cotizaciones');
}

export async function cambiarEstadoCotizacion(id, estado) {
  return apiFetch(`/cotizaciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

export async function getResumenReportes() {
  return apiFetch('/reportes/resumen');
}

export async function getAuditoria() {
  return apiFetch('/auditoria');
}