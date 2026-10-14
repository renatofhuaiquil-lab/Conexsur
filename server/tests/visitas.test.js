import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db/pool.js';
import { prepararBd, crearUsuario, iniciarServidor, crearCliente } from './ayudas.js';

let srv, admin, cliente, tecnico, tecnicoId, tecnico2Id, clienteId;
const siguienteDiaHabil = (sumar = 3) => { // fecha futura que no sea domingo, en formato AAAA-MM-DD
  const d = new Date(Date.now() + sumar * 86_400_000);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const FECHA = siguienteDiaHabil();
const solicitud = (hora, extra = {}) => ({ tipo: 'soporte', motivo: 'Sin señal desde ayer', fecha: FECHA, hora, ...extra });

before(async () => {
  await prepararBd();
  await crearUsuario('admin@x.cl', 'administrador');
  tecnicoId = await crearUsuario('tec1@x.cl', 'tecnico');
  tecnico2Id = await crearUsuario('tec2@x.cl', 'tecnico');
  const usuarioCliente = await crearUsuario('cli@x.cl', 'cliente');
  const { rows } = await pool.query(
    `INSERT INTO clientes (usuario_id, rut, nombre, direccion, comuna) VALUES ($1, '12345678-5', 'Camila Rojas', 'Calle 1', 'Osorno') RETURNING id`, [usuarioCliente]);
  clienteId = rows[0].id;
  srv = await iniciarServidor();
  admin = crearCliente(srv.base); cliente = crearCliente(srv.base); tecnico = crearCliente(srv.base);
  await admin.post('/auth/login', { correo: 'admin@x.cl', clave: 'Clave1234!' });
  await cliente.post('/auth/login', { correo: 'cli@x.cl', clave: 'Clave1234!' });
  await tecnico.post('/auth/login', { correo: 'tec1@x.cl', clave: 'Clave1234!' });
});
after(async () => { await srv.cerrar(); await pool.end(); });

let visita1;
test('HU-07: el cliente ve franjas disponibles y solicita una visita (queda Pendiente con código)', async () => {
  const disp = await cliente.get(`/visitas/disponibilidad?fecha=${FECHA}`);
  assert.equal(disp.estado, 200);
  assert.ok(disp.cuerpo.franjas.find((f) => f.hora === '10:00').disponible);
  const r = await cliente.post('/visitas', solicitud('10:00'));
  assert.equal(r.estado, 201);
  assert.equal(r.cuerpo.visita.estado, 'solicitada');
  assert.match(r.cuerpo.visita.codigo, /^VT-\d{5}$/);
  assert.equal(r.cuerpo.visita.horaInicio, '10:00');
  assert.equal(r.cuerpo.visita.horaFin, '11:00');
  visita1 = r.cuerpo.visita;
});

test('HU-07: no permite dos visitas del mismo cliente en el mismo horario', async () => {
  assert.equal((await cliente.post('/visitas', solicitud('10:00'))).estado, 409);
});

test('HU-07: un horario sin técnicos libres deja de ofrecerse y no se puede reservar', async () => {
  // Hay 2 técnicos activos: una segunda solicitud de otro cliente llena la franja de las 10:00.
  const u2 = await crearUsuario('cli2@x.cl', 'cliente');
  await pool.query(`INSERT INTO clientes (usuario_id, rut, nombre, direccion, comuna) VALUES ($1, '15234876-2', 'Otro', 'Calle 2', 'Osorno')`, [u2]);
  const otro = crearCliente(srv.base);
  await otro.post('/auth/login', { correo: 'cli2@x.cl', clave: 'Clave1234!' });
  assert.equal((await otro.post('/visitas', solicitud('10:00'))).estado, 201);
  const disp = await cliente.get(`/visitas/disponibilidad?fecha=${FECHA}`);
  assert.equal(disp.cuerpo.franjas.find((f) => f.hora === '10:00').disponible, false);
  const u3 = await crearUsuario('cli3@x.cl', 'cliente');
  await pool.query(`INSERT INTO clientes (usuario_id, rut, nombre, direccion, comuna) VALUES ($1, '9876543-3', 'Tercero', 'Calle 3', 'Osorno')`, [u3]);
  const tercero = crearCliente(srv.base);
  await tercero.post('/auth/login', { correo: 'cli3@x.cl', clave: 'Clave1234!' });
  assert.equal((await tercero.post('/visitas', solicitud('10:00'))).estado, 409);
});

test('HU-07: rechaza horarios pasados, domingos y datos inválidos', async () => {
  assert.equal((await cliente.post('/visitas', solicitud('09:00', { fecha: '2020-01-06' }))).estado, 400);
  assert.equal((await cliente.post('/visitas', solicitud('13:00'))).estado, 400); // hora fuera de las franjas
  assert.equal((await cliente.post('/visitas', solicitud('09:00', { tipo: 'otro' }))).estado, 400);
  const domingo = new Date(Date.UTC(2030, 0, 6)).toISOString().slice(0, 10); // 6-ene-2030 es domingo
  assert.equal((await cliente.post('/visitas', solicitud('09:00', { fecha: domingo }))).estado, 400);
  assert.equal((await cliente.get(`/visitas/disponibilidad?fecha=${domingo}`)).cuerpo.cerrado, true);
});

test('Solo el cliente solicita; solo el administrador confirma', async () => {
  assert.equal((await admin.post('/visitas', solicitud('11:00'))).estado, 403);
  assert.equal((await cliente.patch(`/visitas/${visita1.id}/confirmar`, { tecnicoId })).estado, 403);
  assert.equal((await cliente.get('/visitas/pendientes')).estado, 403);
});

test('HU-09: el administrador ve pendientes y confirma con un técnico (estado Confirmada)', async () => {
  const pend = await admin.get('/visitas/pendientes');
  assert.ok(pend.cuerpo.visitas.length >= 1);
  const r = await admin.patch(`/visitas/${visita1.id}/confirmar`, { tecnicoId });
  assert.equal(r.estado, 200);
  assert.equal(r.cuerpo.visita.estado, 'confirmada');
  assert.equal(r.cuerpo.visita.tecnicoId, tecnicoId);
  assert.equal((await admin.patch(`/visitas/${visita1.id}/confirmar`, { tecnicoId })).estado, 409); // ya no está pendiente
  const mias = await cliente.get('/visitas/mias');
  assert.equal(mias.cuerpo.visitas.find((v) => v.id === visita1.id).estado, 'confirmada'); // el cliente ve el cambio
});

test('HU-09: impide asignar un técnico con otra visita confirmada en ese horario', async () => {
  const pend = (await admin.get('/visitas/pendientes')).cuerpo.visitas.find((v) => v.horaInicio === '10:00');
  assert.ok(pend);
  const r = await admin.patch(`/visitas/${pend.id}/confirmar`, { tecnicoId }); // tecnicoId ya atiende a las 10:00
  assert.equal(r.estado, 409);
  assert.match(r.cuerpo.error.mensaje, /técnico ya tiene/);
  assert.equal((await admin.patch(`/visitas/${pend.id}/confirmar`, { tecnicoId: tecnico2Id })).estado, 200); // el otro técnico sí
});

test('HU-08: calendario del administrador (todo) y del técnico (solo lo suyo)', async () => {
  const rango = `desde=${FECHA}&hasta=${FECHA}`;
  const a = await admin.get(`/visitas?${rango}`);
  assert.equal(a.cuerpo.visitas.length, 2);
  const t = await tecnico.get(`/visitas?${rango}`);
  assert.equal(t.cuerpo.visitas.length, 1);
  assert.equal(t.cuerpo.visitas[0].tecnicoId, tecnicoId);
  assert.equal((await admin.get('/visitas?desde=2026-01-01&hasta=2027-01-01')).estado, 400); // rango demasiado largo
  assert.equal((await cliente.get(`/visitas?${rango}`)).estado, 403);
});

test('GET /tecnicos lista técnicos activos solo al administrador', async () => {
  assert.equal((await admin.get('/tecnicos')).cuerpo.tecnicos.length, 2);
  assert.equal((await cliente.get('/tecnicos')).estado, 403);
});

test('HU-12 y HU-13: portal con plan, estado, boleta con alerta y próxima visita', async () => {
  const { rows: [plan] } = await pool.query(`SELECT id FROM planes WHERE nombre = 'Fibra 600'`);
  await pool.query('UPDATE clientes SET plan_id = $1 WHERE id = $2', [plan.id, clienteId]);
  await pool.query(`INSERT INTO boletas (cliente_id, periodo, monto_clp, vencimiento) VALUES ($1, date_trunc('month', now())::date, 19990, current_date + 3)`, [clienteId]);
  const r = await cliente.get('/portal/inicio');
  assert.equal(r.estado, 200);
  assert.equal(r.cuerpo.cliente.planNombre, 'Fibra 600');
  assert.equal(r.cuerpo.cliente.estadoServicio, 'activo');
  assert.equal(r.cuerpo.boletaPendiente.montoClp, 19990);
  assert.equal(r.cuerpo.boletaPendiente.alerta, true);
  assert.ok(r.cuerpo.proximaVisita);
  const b = await cliente.get('/portal/boletas');
  assert.equal(b.cuerpo.boletas.length, 1);
  assert.equal((await admin.get('/portal/inicio')).estado, 403);
});

test('Resumen del administrador', async () => {
  const r = await admin.get('/resumen');
  assert.equal(r.estado, 200);
  assert.equal(r.cuerpo.indicadores.clientesActivos, 3);
  assert.ok(r.cuerpo.indicadores.montoPorCobrar >= 19990);
  assert.equal((await cliente.get('/resumen')).estado, 403);
});
