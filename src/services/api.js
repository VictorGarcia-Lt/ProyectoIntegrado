// services/api.js
// Cliente HTTP base para comunicarse con el Backend.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Token JWT guardado en memoria (no en localStorage).
let tokenEnMemoria = null;

export function setToken(t) {
  tokenEnMemoria = t;
}

export function getToken() {
  return tokenEnMemoria;
}

// Petición reutilizable.
// endpoint: ruta relativa, ej. '/auth/login'
// options: { method, body, headers, ... }
export async function apiFetch(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };

  // Content-Type automático, excepto si el body es FormData (el navegador pone el boundary).
  if (!(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  // Adjuntar JWT si existe.
  if (tokenEnMemoria) {
    headers['Authorization'] = `Bearer ${tokenEnMemoria}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Intentar parsear JSON; si no es JSON, devolver texto.
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const mensaje = (data && (data.error || data.message)) || res.statusText || 'Error de red';
    const error = new Error(mensaje);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Gestión de técnicos
export function crearTecnico(data) {
  return apiFetch('/tecnicos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Catálogo de repuestos e inventario
export function getRepuestos() {
  return apiFetch('/repuestos');
}

export function crearRepuesto(data) {
  return apiFetch('/repuestos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function actualizarRepuesto(id, data) {
  return apiFetch(`/repuestos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Evaluación económica y conversión de cotizaciones
export function evaluarCotizacion(id, data) {
  return apiFetch(`/cotizaciones/${id}/evaluar`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function convertirCotizacionASolicitud(id, data) {
  return apiFetch(`/cotizaciones/${id}/convertir`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}