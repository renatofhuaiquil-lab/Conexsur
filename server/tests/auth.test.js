import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db/pool.js';
import { prepararBd, crearUsuario, iniciarServidor, crearCliente } from './ayudas.js';

let srv;
before(async () => { await prepararBd(); await crearUsuario('admin@x.cl', 'administrador'); await crearUsuario('cli@x.cl', 'cliente'); srv = await iniciarServidor(); });
after(async () => { await srv.cerrar(); await pool.end(); });

test('login correcto entrega cookie httpOnly y /me devuelve el usuario', async () => {
  const c = crearCliente(srv.base);
  const r = await c.post('/auth/login', { correo: 'admin@x.cl', clave: 'Clave1234!' });
  assert.equal(r.estado, 200);
  assert.equal(r.cuerpo.usuario.rol, 'administrador');
  assert.match(r.cabeceras.get('set-cookie'), /HttpOnly/i);
  assert.match(r.cabeceras.get('set-cookie'), /SameSite=Strict/i);
  assert.equal(r.cuerpo.usuario.clave_hash, undefined);
  const yo = await c.get('/auth/me');
  assert.equal(yo.estado, 200);
  assert.equal(yo.cuerpo.usuario.correo, 'admin@x.cl');
});

test('login incorrecto no revela si el correo existe', async () => {
  const c = crearCliente(srv.base);
  const a = await c.post('/auth/login', { correo: 'admin@x.cl', clave: 'mala' });
  const b = await c.post('/auth/login', { correo: 'noexiste@x.cl', clave: 'mala' });
  assert.equal(a.estado, 401);
  assert.equal(b.estado, 401);
  assert.equal(a.cuerpo.error.mensaje, b.cuerpo.error.mensaje);
});

test('datos inválidos devuelven 400 con detalle', async () => {
  const r = await crearCliente(srv.base).post('/auth/login', { correo: 'no-es-correo' });
  assert.equal(r.estado, 400);
  assert.equal(r.cuerpo.error.codigo, 'VALIDACION');
});

test('rutas protegidas exigen sesión y respetan el rol', async () => {
  const sinSesion = await crearCliente(srv.base).get('/clientes');
  assert.equal(sinSesion.estado, 401);
  const c = crearCliente(srv.base);
  await c.post('/auth/login', { correo: 'cli@x.cl', clave: 'Clave1234!' });
  assert.equal((await c.get('/clientes')).estado, 403);
});

test('logout elimina la sesión', async () => {
  const c = crearCliente(srv.base);
  await c.post('/auth/login', { correo: 'admin@x.cl', clave: 'Clave1234!' });
  assert.equal((await c.post('/auth/logout')).estado, 204);
  assert.equal((await c.get('/auth/me')).estado, 401);
});

test('5 intentos fallidos bloquean la cuenta temporalmente', async () => {
  await crearUsuario('bloq@x.cl', 'cliente');
  const c = crearCliente(srv.base);
  for (let i = 0; i < 5; i++) await c.post('/auth/login', { correo: 'bloq@x.cl', clave: 'mala' });
  const r = await c.post('/auth/login', { correo: 'bloq@x.cl', clave: 'Clave1234!' }); // aun con la clave correcta
  assert.equal(r.estado, 429);
});

test('un Origin ajeno es rechazado en métodos que modifican datos', async () => {
  const r = await crearCliente(srv.base).post('/auth/login', { correo: 'admin@x.cl', clave: 'Clave1234!' }, { origin: 'http://sitio-malicioso.com' });
  assert.equal(r.estado, 403);
});
