import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db/pool.js';
import { prepararBd, crearUsuario, iniciarServidor, crearCliente } from './ayudas.js';

let srv, admin, adminId;
const datos = { rut: '12.345.678-5', nombre: 'María Pérez', direccion: 'Av. Costanera 123', comuna: 'Puerto Montt' };

before(async () => {
  await prepararBd();
  adminId = await crearUsuario('admin@x.cl', 'administrador');
  srv = await iniciarServidor();
  admin = crearCliente(srv.base);
  await admin.post('/auth/login', { correo: 'admin@x.cl', clave: 'Clave1234!' });
});
after(async () => { await srv.cerrar(); await pool.end(); });

test('HU-03: registra un cliente y normaliza el RUT', async () => {
  const r = await admin.post('/clientes', datos);
  assert.equal(r.estado, 201);
  assert.equal(r.cuerpo.cliente.rut, '12345678-5');
  assert.equal(r.cuerpo.cliente.estadoServicio, 'activo');
});

test('HU-03: rechaza RUT con dígito verificador incorrecto', async () => {
  const r = await admin.post('/clientes', { ...datos, rut: '12.345.678-9' });
  assert.equal(r.estado, 400);
});

test('HU-03: rechaza RUT duplicado con 409', async () => {
  const r = await admin.post('/clientes', datos);
  assert.equal(r.estado, 409);
});

test('HU-04: ficha del cliente y cambio de estado con registro de quién y cuándo', async () => {
  const { cuerpo: { clientes } } = await admin.get('/clientes');
  const id = clientes[0].id;
  const cambio = await admin.patch(`/clientes/${id}/estado`, { estado: 'cortado' });
  assert.equal(cambio.estado, 200);
  const ficha = await admin.get(`/clientes/${id}`);
  assert.equal(ficha.cuerpo.cliente.estadoServicio, 'cortado');
  assert.equal(ficha.cuerpo.cliente.estadoCambiadoPor, 'Usuario administrador');
  assert.ok(ficha.cuerpo.cliente.estadoCambiadoEn);
  assert.deepEqual(ficha.cuerpo.cliente.visitas, []);
  const { rows } = await pool.query("SELECT usuario_id FROM auditoria WHERE accion = 'cliente.cambiar_estado'");
  assert.equal(rows[0].usuario_id, adminId);
});

test('HU-04: identificador inválido o inexistente', async () => {
  assert.equal((await admin.get('/clientes/no-es-uuid')).estado, 400);
  assert.equal((await admin.get('/clientes/00000000-0000-0000-0000-000000000000')).estado, 404);
});

test('Una inyección SQL en el RUT no pasa la validación', async () => {
  const r = await admin.post('/clientes', { ...datos, rut: "1'; DROP TABLE clientes;--" });
  assert.equal(r.estado, 400);
});

test('GET /planes exige sesión y lista los planes activos', async () => {
  assert.equal((await crearCliente(srv.base).get('/planes')).estado, 401);
  const r = await admin.get('/planes');
  assert.equal(r.estado, 200);
  assert.ok(r.cuerpo.planes.length >= 1);
});
