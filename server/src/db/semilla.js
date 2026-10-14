// Datos de demostración para desarrollo: usuarios, clientes, visitas de la semana actual y boletas.
// NO usar en producción. Uso: npm run semilla            (agrega lo que falte)
//                           npm run semilla -- --limpiar (borra los datos y los vuelve a crear)
import { pool, enTransaccion } from './pool.js';
import { hashearClave } from '../utilidades/claves.js';
import { calcularDv } from '../utilidades/rut.js';
import { esProduccion } from '../config/env.js';

if (esProduccion) throw new Error('La semilla no puede ejecutarse en producción.');
const CLAVE_DEMO = 'Demo1234!';
const TZ = `'America/Santiago'`;
const rut = (cuerpo) => `${cuerpo}-${calcularDv(String(cuerpo))}`;

const USUARIOS = [
  ['admin@conexsur.cl', 'administrador', 'Andrea Contreras'],
  ['tecnico@conexsur.cl', 'tecnico', 'Marcelo Díaz'],
  ['tecnico2@conexsur.cl', 'tecnico', 'Sofía Vargas'],
  ['cliente@conexsur.cl', 'cliente', 'Camila Rojas'],
];

// [rut, nombre, dirección, comuna, plan, estado, usuario vinculado]
const CLIENTES = [
  [12456789, 'Camila Rojas', 'Av. Angelmó 1520', 'Puerto Montt', 'Fibra 600', 'activo', 'cliente@conexsur.cl'],
  [15234876, 'Jorge Alarcón Mella', 'Los Notros 342', 'Osorno', 'Fibra 300', 'activo'],
  [9876543, 'Patricia Navarro', 'Pedro de Valdivia 88', 'Valdivia', 'Fibra 940', 'activo'],
  [17345210, 'Felipe Ibarra Soto', 'Av. Costanera 2210', 'Puerto Varas', 'Fibra 600', 'activo'],
  [13567890, 'Carolina Muñoz', 'Calle Ramírez 415', 'Castro', 'Fibra 300', 'activo'],
  [8765432, 'Hernán Gallardo', 'Pasaje Los Lingues 12', 'Puerto Montt', 'Fibra 300', 'cortado'],
  [16789012, 'Daniela Fuentes Paz', 'Av. Alemania 1900', 'Temuco', 'Fibra 600', 'activo'],
  [14123456, 'Rodrigo Silva Oyarzún', 'Bulnes 770', 'Osorno', 'Fibra 940', 'activo'],
];

// [día desde el lunes, hora, tipo, estado si ya pasó, estado si es futuro, cliente, técnico]
const VISITAS = [
  [0, '09:00', 'instalacion', 'realizada', 'confirmada', 1, 1], [0, '11:00', 'soporte', 'realizada', 'confirmada', 2, 2],
  [1, '10:00', 'soporte', 'realizada', 'confirmada', 3, 1], [1, '15:00', 'instalacion', 'realizada', 'confirmada', 4, 2],
  [2, '09:00', 'mantencion', 'realizada', 'confirmada', 5, 1], [2, '12:00', 'soporte', 'solicitada', 'solicitada', 6, null],
  [3, '10:00', 'soporte', 'solicitada', 'solicitada', 7, null], [3, '16:00', 'instalacion', 'confirmada', 'confirmada', 3, 2],
  [4, '11:00', 'mantencion', 'solicitada', 'solicitada', 2, null], [4, '14:00', 'soporte', 'confirmada', 'confirmada', 1, 1],
  [5, '10:00', 'instalacion', 'confirmada', 'confirmada', 4, 2],
];

if (process.argv.includes('--limpiar')) {
  await pool.query('TRUNCATE auditoria, eventos_mercadopago, pagos, boletas, visitas, clientes, usuarios RESTART IDENTITY CASCADE');
  console.log('Datos anteriores eliminados.');
}

const clave = await hashearClave(CLAVE_DEMO);
const idUsuario = {};
for (const [correo, rol, nombre] of USUARIOS) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (correo, clave_hash, rol, nombre) VALUES ($1, $2, $3, $4)
     ON CONFLICT (correo) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`, [correo, clave, rol, nombre]);
  idUsuario[correo] = rows[0].id;
}
const tecnicos = [idUsuario['tecnico@conexsur.cl'], idUsuario['tecnico2@conexsur.cl']];

const idsCliente = [];
for (const [cuerpo, nombre, direccion, comuna, plan, estado, correoUsuario] of CLIENTES) {
  const { rows } = await pool.query(
    `INSERT INTO clientes (rut, nombre, direccion, comuna, plan_id, estado_servicio, usuario_id, correo, telefono)
     VALUES ($1, $2, $3, $4, (SELECT id FROM planes WHERE nombre = $5), $6, $7, $8, $9)
     ON CONFLICT (rut) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
    [rut(cuerpo), nombre, direccion, comuna, plan, estado, correoUsuario ? idUsuario[correoUsuario] : null,
     `${nombre.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@correo.cl`, `+56 9 ${6000 + cuerpo % 3999} ${1000 + cuerpo % 8999}`]);
  idsCliente.push(rows[0].id);
}

// Visitas de la semana actual (solo si aún no hay visitas).
if ((await pool.query('SELECT count(*)::int AS n FROM visitas')).rows[0].n === 0) {
  const { rows: [{ lunes, ahora }] } = await pool.query(
    `SELECT to_char(date_trunc('week', now() AT TIME ZONE ${TZ}), 'YYYY-MM-DD') AS lunes,
            to_char(now() AT TIME ZONE ${TZ}, 'YYYY-MM-DD HH24:MI') AS ahora`);
  for (const [dia, hora, tipo, estadoPasado, estadoFuturo, c, t] of VISITAS) {
    const { rows: [{ fecha }] } = await pool.query(`SELECT to_char($1::date + $2::int, 'YYYY-MM-DD') AS fecha`, [lunes, dia]);
    const pasado = `${fecha} ${hora}` <= ahora;
    const estado = pasado ? estadoPasado : estadoFuturo;
    const motivo = { instalacion: 'Instalación de fibra óptica', soporte: 'Sin señal o internet lento', mantencion: 'Mantención preventiva del equipo' }[tipo];
    await pool.query(
      `INSERT INTO visitas (cliente_id, tecnico_id, tipo, motivo, inicio, fin, estado)
       VALUES ($1, $2, $3, $4, ($5::date + $6::time) AT TIME ZONE ${TZ}, ($5::date + $6::time + interval '60 minutes') AT TIME ZONE ${TZ}, $7)`,
      [idsCliente[c], t ? tecnicos[t - 1] : null, tipo, motivo, fecha, hora, estado]);
  }
}

// Boletas: la del cliente demo vence en 4 días (muestra la alerta de HU-13).
if ((await pool.query('SELECT count(*)::int AS n FROM boletas')).rows[0].n === 0) {
  const precios = { 'Fibra 300': 15990, 'Fibra 600': 19990, 'Fibra 940': 24990 };
  for (const [i, [, , , , plan, estado]] of CLIENTES.entries()) {
    const monto = precios[plan];
    // Mes actual: pendiente (vencimiento a 4 días para el cliente demo, 12 para el resto; el cliente cortado ya está vencido).
    const dias = i === 0 ? 4 : estado === 'cortado' ? -9 : 12;
    await pool.query(
      `INSERT INTO boletas (cliente_id, periodo, monto_clp, vencimiento, estado)
       VALUES ($1, date_trunc('month', now() AT TIME ZONE ${TZ})::date, $2, (now() AT TIME ZONE ${TZ})::date + $3::int, $4)`,
      [idsCliente[i], monto, dias, dias < 0 ? 'vencida' : 'pendiente']);
    for (const meses of [1, 2, 3]) {
      if (estado === 'cortado' && meses === 1) continue; // el cliente cortado no pagó el mes anterior
      await pool.query(
        `INSERT INTO boletas (cliente_id, periodo, monto_clp, vencimiento, estado)
         VALUES ($1, (date_trunc('month', now() AT TIME ZONE ${TZ}) - make_interval(months => $2::int))::date, $3,
                 ((date_trunc('month', now() AT TIME ZONE ${TZ}) - make_interval(months => $2::int))::date + 15), 'pagada')`,
        [idsCliente[i], meses, monto]);
    }
  }
}
console.log(`Datos de demostración listos (clave de todos los usuarios: ${CLAVE_DEMO}):`);
console.log(USUARIOS.map((u) => `  ${u[1].padEnd(13)} ${u[0]}`).join('\n'));
await pool.end();
