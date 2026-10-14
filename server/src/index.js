import { env } from './config/env.js';
import { crearApp } from './app.js';
import { pool } from './db/pool.js';

const servidor = crearApp().listen(env.PUERTO, () =>
  console.log(`API CONEXSUR escuchando en el puerto ${env.PUERTO} (${env.NODE_ENV})`));

// Cierre ordenado para no cortar solicitudes en curso.
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => servidor.close(async () => { await pool.end(); process.exit(0); }));
}
