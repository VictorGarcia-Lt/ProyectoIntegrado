// server.js
// Punto de entrada del servidor. Verifica la conexión a PostgreSQL
// antes de empezar a escuchar el puerto.

import dotenv from 'dotenv';
import app from './app.js';
import { testConnection } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    // Verificamos la base de datos antes de aceptar tráfico.
    await testConnection();
    console.log('✅ Conexión a PostgreSQL exitosa');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor JG Frío escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo conectar a PostgreSQL:', error.message);
    process.exit(1);
  }
}

main();