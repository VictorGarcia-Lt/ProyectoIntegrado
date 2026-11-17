// services/securityService.js
// Servicios de seguridad: OTP aleatorio y envío de correo (o modo demo).

import crypto from 'crypto';

// Genera un código OTP de 6 dígitos criptográficamente seguro.
export function generarCodigoOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Intenta enviar el correo si hay SMTP configurado; si no, retorna el código para demo.
export async function enviarCodigoPorCorreo(correo, codigo) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Modo demo/evaluación: sin SMTP, se devuelve el código para mostrarlo en pantalla.
    console.log(`[DEMO] Código OTP para ${correo}: ${codigo}`);
    return { enviadoPorCorreo: false, codigoDemo: codigo };
  }

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: correo,
      subject: 'Código de verificación - JG Frío',
      text: `Tu código de verificación es: ${codigo}. Válido por 3 minutos.`,
    });
    return { enviadoPorCorreo: true };
  } catch (error) {
    console.error('Error enviando correo OTP:', error.message);
    return { enviadoPorCorreo: false, codigoDemo: codigo };
  }
}