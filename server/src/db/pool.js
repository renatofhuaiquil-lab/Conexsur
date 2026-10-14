// Conexión a PostgreSQL. Todas las consultas del sistema deben ser parametrizadas ($1, $2...).
import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 });

/** Ejecuta una consulta parametrizada. */
export const consultar = (sql, params = []) => pool.query(sql, params);

/**
 * Ejecuta varias operaciones dentro de una transacción.
 * Si la función lanza un error se hace ROLLBACK; si no, COMMIT.
 */
export async function enTransaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
