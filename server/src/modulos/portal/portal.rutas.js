// Portal del cliente: plan y estado del servicio (HU-12) y boletas (HU-13).
import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { consultar } from '../../db/pool.js';
import { ZONA_HORARIA, DIAS_ALERTA_VENCIMIENTO } from '../../config/agenda.js';
import { prohibido } from '../../utilidades/errores.js';

const TZ = `'${ZONA_HORARIA}'`;

async function clienteActual(usuarioId) {
  const { rows } = await consultar(
    `SELECT c.id, c.nombre, c.estado_servicio AS "estadoServicio", c.direccion, c.comuna,
            p.nombre AS "planNombre", p.velocidad_mbps AS "planVelocidadMbps", p.precio_clp AS "planPrecioClp"
       FROM clientes c LEFT JOIN planes p ON p.id = c.plan_id WHERE c.usuario_id = $1`, [usuarioId]);
  if (!rows[0]) throw prohibido('Tu cuenta no está asociada a un cliente.');
  return rows[0];
}

const SQL_BOLETA = `
  SELECT id, to_char(periodo, 'YYYY-MM-DD') AS periodo, monto_clp AS "montoClp", to_char(vencimiento, 'YYYY-MM-DD') AS vencimiento,
         estado, (vencimiento - (now() AT TIME ZONE ${TZ})::date) AS "diasRestantes"
    FROM boletas`;

const r = Router();
r.use(autenticar, autorizar('cliente'));

r.get('/inicio', async (req, res) => {
  const cliente = await clienteActual(req.usuario.id);
  const { rows: [boleta] } = await consultar(`${SQL_BOLETA} WHERE cliente_id = $1 AND estado <> 'pagada' ORDER BY vencimiento LIMIT 1`, [cliente.id]);
  const { rows: [visita] } = await consultar(
    `SELECT 'VT-' || lpad(numero::text, 5, '0') AS codigo, tipo, estado,
            to_char(inicio AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS fecha, to_char(inicio AT TIME ZONE ${TZ}, 'HH24:MI') AS hora
       FROM visitas WHERE cliente_id = $1 AND estado IN ('solicitada','confirmada') AND inicio >= now() ORDER BY inicio LIMIT 1`, [cliente.id]);
  res.json({
    cliente,
    boletaPendiente: boleta ? { ...boleta, alerta: boleta.diasRestantes <= DIAS_ALERTA_VENCIMIENTO, vencida: boleta.diasRestantes < 0 } : null,
    proximaVisita: visita ?? null,
  });
});

r.get('/boletas', async (req, res) => {
  const cliente = await clienteActual(req.usuario.id);
  const { rows } = await consultar(`${SQL_BOLETA} WHERE cliente_id = $1 ORDER BY periodo DESC LIMIT 12`, [cliente.id]);
  res.json({
    cliente: { planNombre: cliente.planNombre, planVelocidadMbps: cliente.planVelocidadMbps },
    boletas: rows.map((b) => ({ ...b, vencida: b.estado !== 'pagada' && b.diasRestantes < 0, alerta: b.estado !== 'pagada' && b.diasRestantes <= DIAS_ALERTA_VENCIMIENTO })),
  });
});
export default r;
