// services/authService.js
import { apiFetch, setToken } from './api.js';

export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, pass: password }),
  });
  // Si el backend entrega token directo, guardarlo en memoria.
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function verificar2FA(code, tempToken) {
  const data = await apiFetch('/auth/2fa', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tempToken}` },
    body: JSON.stringify({ code }),
  });
  if (data.token) {
    setToken(data.token);
  }
  return data;
}