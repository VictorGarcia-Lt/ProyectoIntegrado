// services/operacionesService.js
import { apiFetch } from './api.js';

export async function getSolicitudes(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.estado) params.append('estado', filtros.estado);
  if (filtros.zona) params.append('zona', filtros.zona);
  if (filtros.urg) params.append('urg', filtros.urg);
  if (filtros.q) params.append('q', filtros.q);

  const qs = params.toString();
  const endpoint = qs ? `/solicitudes?${qs}` : '/solicitudes';
  return apiFetch(endpoint);
}

export async function crearSolicitud(datos) {
  return apiFetch('/solicitudes', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function asignarTecnico(solicitudId, tecId) {
  return apiFetch(`/solicitudes/${solicitudId}/asignar`, {
    method: 'PATCH',
    body: JSON.stringify({ tec_id: tecId }),
  });
}

export async function getClientes() {
  return apiFetch('/clientes');
}

export async function getHistorialCliente(clienteId) {
  return apiFetch(`/clientes/${clienteId}/historial`);
}

export async function crearCliente(datos) {
  return apiFetch('/clientes', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function getTecnicos() {
  return apiFetch('/tecnicos');
}

export async function cambiarDisponibilidad(tecId, disponible, nota) {
  return apiFetch(`/tecnicos/${tecId}/disponibilidad`, {
    method: 'PATCH',
    body: JSON.stringify({ disponible, nota }),
  });
}