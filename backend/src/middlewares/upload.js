// middlewares/upload.js
// Configuración de multer para subida de archivos (firmas, fotos).
// Solo imágenes y máximo 2 MB.

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta destino: backend/uploads
const DESTINO = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DESTINO);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nombreUnico);
  },
});

// Tipos MIME permitidos
const MIMES_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];

function fileFilter(_req, file, cb) {
  if (MIMES_PERMITIDOS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Solo PNG, JPEG o WEBP.'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

export default upload;