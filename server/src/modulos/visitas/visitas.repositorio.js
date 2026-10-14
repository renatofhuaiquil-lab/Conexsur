// SQL de visitas técnicas. Las fechas se manejan en hora de Chile (America/Santiago) dentro de la base de datos,
// y se entregan al cliente como texto local (fecha AAAA-MM-DD y hora HH:MM) para evitar errores de zona horaria.
import { consultar } from '../../db/pool.js';
import { ZONA_HORARIA, DURACION_MINUTOS } from '../../config/agenda.js';

const TZ = `'${ZONA_HORARIA}'`; // constante interna, nunca proviene del usuario

const SELECT_VISITA = `
  SELECT v.id, 'VT-' || lpad(v.numero::text, 5, '0') AS codigo, v.tipo, v.motivo, v.estado,
         to_char(v.inicio AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS fecha,
         to_char(v.inicio AT TIME ZONE ${TZ}, 'HH24:MI')    AS "horaInicio",
         to_char(v.fin    AT TIME ZONE ${TZ}, 'HH24:MI')    AS "horaFin",
         c.id AS "clienteId", c.nombre AS "clienteNombre", c.direccion, c.comuna,
         t.id AS "tecnicoId", t.nombre AS "tecnicoNombre"
    FROM visitas v
    JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN usuarios t ON t.id = v.tecnico_id`;

// Inicio y fin del día [$1, $1 + 1) en hora de Chile.
const RANGO_DIA = `v.inicio >= (($1::date)::timestamp AT TIME ZONE ${TZ}) AND v.inicio < (($1::date + 1)::timestamp AT TIME ZONE ${TZ})`;

/** Hora actual en Chile como texto "AAAA-MM-DD HH:MM" (comparable con fecha + hora). */
export const ahoraChile = async () =>
  (await consultar(`SELECT to_char(now() AT TIME ZONE ${TZ}, 'YYYY-MM-DD HH24:MI') AS ahora`)).rows[0].ahora;

export const contarTecnicosActivos = async () =>
  (await consultar(`SELECT count(*)::int AS n FROM usuarios WHERE rol = 'tecnico' AND activo`)).rows[0].n;

/** Cantidad de visitas vigentes (solicitadas o confirmadas) por franja horaria de un día. */
export const ocupacionDelDia = async (fecha) =>
  (await consultar(
    `SELECT to_char(v.inicio AT TIME ZONE ${TZ}, 'HH24:MI') AS hora, count(*)::int AS n
       FROM visitas v WHERE v.estado IN ('solicitada', 'confirmada') AND ${RANGO_DIA} GROUP BY 1`, [fecha])).rows;

export const clienteDeUsuario = async (usuarioId) =>
  (await consultar('SELECT id FROM clientes WHERE usuario_id = $1', [usuarioId])).rows[0] ?? null;

/** ¿El cliente ya tiene una visita vigente en esa franja? (HU-07, criterio 3) */
export const clienteTieneVisitaEn = async (ejecutor, clienteId, fecha, hora) =>
  (await ejecutor.query(
    `SELECT 1 FROM visitas WHERE cliente_id = $1 AND estado IN ('solicitada', 'confirmada')
        AND inicio = (($2::date + $3::time) AT TIME ZONE ${TZ})`, [clienteId, fecha, hora])).rowCount > 0;

export const ocupacionFranja = async (ejecutor, fecha, hora) =>
  (await ejecutor.query(
    `SELECT count(*)::int AS n FROM visitas WHERE estado IN ('solicitada', 'confirmada')
        AND inicio = (($1::date + $2::time) AT TIME ZONE ${TZ})`, [fecha, hora])).rows[0].n;

export const insertar = async (ejecutor, { clienteId, tipo, motivo, fecha, hora }) =>
  (await ejecutor.query(
    `INSERT INTO visitas (cliente_id, tipo, motivo, inicio, fin)
     VALUES ($1, $2, $3, (($4::date + $5::time) AT TIME ZONE ${TZ}),
             (($4::date + $5::time + make_interval(mins => ${DURACION_MINUTOS})) AT TIME ZONE ${TZ}))
     RETURNING id`, [clienteId, tipo, motivo, fecha, hora])).rows[0].id;

export const buscarPorId = async (ejecutor, id) =>
  (await ejecutor.query(`${SELECT_VISITA} WHERE v.id = $1`, [id])).rows[0] ?? null;

export const bloquearPorId = async (ejecutor, id) =>
  (await ejecutor.query('SELECT id, estado FROM visitas WHERE id = $1 FOR UPDATE', [id])).rows[0] ?? null;

export const listarRango = async ({ desde, hasta, tecnicoId = null }) =>
  (await consultar(
    `${SELECT_VISITA}
      WHERE v.estado <> 'cancelada'
        AND v.inicio >= (($1::date)::timestamp AT TIME ZONE ${TZ})
        AND v.inicio <  (($2::date + 1)::timestamp AT TIME ZONE ${TZ})
        AND ($3::uuid IS NULL OR v.tecnico_id = $3::uuid)
      ORDER BY v.inicio, c.nombre`, [desde, hasta, tecnicoId])).rows;

export const listarPendientes = async () =>
  (await consultar(`${SELECT_VISITA} WHERE v.estado = 'solicitada' ORDER BY v.inicio`)).rows;

export const listarDeCliente = async (clienteId) =>
  (await consultar(`${SELECT_VISITA} WHERE v.cliente_id = $1 AND v.estado <> 'cancelada' ORDER BY v.inicio DESC LIMIT 20`, [clienteId])).rows;

export const tecnicoActivoExiste = async (ejecutor, id) =>
  (await ejecutor.query(`SELECT 1 FROM usuarios WHERE id = $1 AND rol = 'tecnico' AND activo`, [id])).rowCount > 0;

export const confirmar = (ejecutor, id, tecnicoId) =>
  ejecutor.query(`UPDATE visitas SET estado = 'confirmada', tecnico_id = $2 WHERE id = $1`, [id, tecnicoId]);
