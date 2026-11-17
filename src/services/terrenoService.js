// services/terrenoService.js
import { apiFetch } from './api.js';

export async function getMisOrdenes() {
  return apiFetch('/ordenes/mias');
}

export async function actualizarOrden(ordenId, datos) {
  return apiFetch(`/ordenes/${ordenId}`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
}

export async function subirAdjunto(ordenId, archivoBlob, tipo) {
  const formData = new FormData();
  formData.append('archivo', archivoBlob);
  formData.append('tipo', tipo);
  return apiFetch(`/ordenes/${ordenId}/adjuntos`, {
    method: 'POST',
    body: formData,
  });
}

export async function sincronizarColaOffline(cambios) {
  return apiFetch('/ordenes/sync', {
    method: 'POST',
    body: JSON.stringify({ cambios }),
  });
}