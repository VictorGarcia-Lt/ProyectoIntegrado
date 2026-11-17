// config/db.js
// Conexión a PostgreSQL usando un Pool de conexiones reutilizables.
// Se exporta una función query(text, params) para ejecutar SQL parametrizado.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Pool compartido por toda la aplicación.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En producción conviene activar SSL; en desarrollo local se deja desactivado.
  // Soporte SSL para Supabase/producción: si la URL no es localhost o estamos en producción, activar SSL.
  ssl:
    process.env.NODE_ENV === 'production' || !(process.env.DATABASE_URL || '').includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
  // Ajustes para el pooler de Supabase
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Verifica que la base de datos responda. Lanza error si no hay conexión.
export async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

// Ejecuta una consulta SQL parametrizada.
// text: string SQL con placeholders $1, $2, ...
// params: arreglo de valores para los placeholders
export async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    // Reenvía el error para que el middleware de errores lo maneje.
    throw error;
  }
}

export default pool;