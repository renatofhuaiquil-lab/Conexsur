// Aplica los archivos SQL de /db en orden, una sola vez cada uno.
// Uso: npm run migrar
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from './pool.js';

const carpeta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db');

export async function migrar() {
  await pool.query(`CREATE TABLE IF NOT EXISTS migraciones (
    archivo TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const aplicadas = new Set((await pool.query('SELECT archivo FROM migraciones')).rows.map((r) => r.archivo));
  const archivos = (await readdir(carpeta)).filter((a) => a.endsWith('.sql')).sort();
  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue;
    const sql = await readFile(path.join(carpeta, archivo), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO migraciones (archivo) VALUES ($1)', [archivo]);
    console.log(`Migración aplicada: ${archivo}`);
  }
}

// Ejecución directa por línea de comandos.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await migrar();
  await pool.end();
}
