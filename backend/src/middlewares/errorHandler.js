// middlewares/errorHandler.js
// Middleware global de captura de errores.

import multer from 'multer';

export default function errorHandler(err, req, res, next) {
  // Evita responder dos veces si los headers ya se enviaron.
  if (res.headersSent) {
    return next(err);
  }

  const esProduccion = process.env.NODE_ENV === 'production';

  // Errores de multer (tamaño o formato)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el límite de 2 MB' });
    }
    return res.status(400).json({ error: 'Error al subir el archivo' });
  }

  // Error lanzado manualmente por el fileFilter
  if (err && err.message && err.message.includes('Formato de archivo no permitido')) {
    return res.status(400).json({ error: err.message });
  }

  // Error de sintaxis JSON en el body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' });
  }

  // Log interno (siempre)
  console.error('Error no manejado:', err);

  // Respuesta al cliente: genérica en producción
  if (esProduccion) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
}