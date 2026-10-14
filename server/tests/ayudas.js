// Utilidades comunes para las pruebas: base de datos limpia y cliente HTTP con cookies.
import { crearApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { migrar } from '../src/db/migrar.js';
import { hashearClave } from '../src/utilidades/claves.js';

export async function prepararBd() {
  await migrar();
  await pool.query('TRUNCATE auditoria, eventos_mercadopago, pagos, boletas, visitas, clientes, usuarios RESTART IDENTITY CASCADE');
}

export async function crearUsuario(correo, rol, clave = 'Clave1234!') {
  const { rows } = await pool.query(
    'INSERT INTO usuarios (correo, clave_hash, rol, nombre) VALUES ($1,$2,$3,$4) RETURNING id',
    [correo, await hashearClave(clave), rol, `Usuario ${rol}`]);
  return rows[0].id;
}

export async function iniciarServidor() {
  const servidor = crearApp().listen(0);
  await new Promise((r) => servidor.once('listening', r));
  const base = `http://127.0.0.1:${servidor.address().port}/api`;
  return { base, cerrar: () => new Promise((r) => servidor.close(r)) };
}

/** Cliente HTTP mínimo que conserva la cookie de sesión. */
export function crearCliente(base) {
  let cookie = '';
  async function pedir(metodo, ruta, cuerpo, cabeceras = {}) {
    const res = await fetch(base + ruta, {
      method: metodo,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...cabeceras },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.startsWith('sesion=;') || set.includes('Expires=Thu, 01 Jan 1970') ? '' : set.split(';')[0];
    const texto = await res.text();
    return { estado: res.status, cuerpo: texto ? JSON.parse(texto) : null, cabeceras: res.headers };
  }
  return {
    get: (r) => pedir('GET', r),
    post: (r, c, h) => pedir('POST', r, c, h),
    patch: (r, c) => pedir('PATCH', r, c),
  };
}
