// SQL de clientes. Todas las consultas son parametrizadas.
import { consultar } from '../../db/pool.js';

const COLUMNAS_LISTA = `c.id, c.rut, c.nombre, c.comuna, c.estado_servicio AS "estadoServicio", p.nombre AS plan`;

export const listar = async () =>
  (await consultar(`SELECT ${COLUMNAS_LISTA} FROM clientes c LEFT JOIN planes p ON p.id = c.plan_id ORDER BY c.nombre`)).rows;

export const crear = async (d) =>
  (await consultar(
    `INSERT INTO clientes (rut, nombre, telefono, correo, direccion, comuna, plan_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, rut, nombre, comuna, estado_servicio AS "estadoServicio"`,
    [d.rut, d.nombre, d.telefono ?? null, d.correo ?? null, d.direccion, d.comuna, d.planId ?? null],
  )).rows[0];

export const buscarFicha = async (id) => {
  const { rows } = await consultar(
    `SELECT c.id, c.rut, c.nombre, c.telefono, c.correo, c.direccion, c.comuna,
            c.estado_servicio AS "estadoServicio", c.estado_cambiado_en AS "estadoCambiadoEn",
            u.nombre AS "estadoCambiadoPor",
            p.nombre AS "planNombre", p.velocidad_mbps AS "planVelocidadMbps", p.precio_clp AS "planPrecioClp"
       FROM clientes c
       LEFT JOIN planes p ON p.id = c.plan_id
       LEFT JOIN usuarios u ON u.id = c.estado_cambiado_por
      WHERE c.id = $1`, [id]);
  return rows[0] ?? null;
};

export const ultimasVisitas = async (clienteId) =>
  (await consultar(
    `SELECT id, tipo, motivo, inicio, fin, estado FROM visitas WHERE cliente_id = $1 ORDER BY inicio DESC LIMIT 10`, [clienteId])).rows;

export const ultimosPagos = async (clienteId) =>
  (await consultar(
    `SELECT id, monto_clp AS "montoClp", estado, confirmado_en AS "confirmadoEn", creado_en AS "creadoEn"
       FROM pagos WHERE cliente_id = $1 ORDER BY creado_en DESC LIMIT 10`, [clienteId])).rows;

/** Cambia el estado del servicio y registra quién y cuándo (RF-06). Recibe el ejecutor de la transacción. */
export const actualizarEstado = async (ejecutor, id, estado, usuarioId) =>
  (await ejecutor.query(
    `UPDATE clientes SET estado_servicio = $2, estado_cambiado_por = $3, estado_cambiado_en = now()
      WHERE id = $1 RETURNING id, estado_servicio AS "estadoServicio", estado_cambiado_en AS "estadoCambiadoEn"`,
    [id, estado, usuarioId])).rows[0] ?? null;
