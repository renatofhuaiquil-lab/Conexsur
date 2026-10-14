// Indicadores para el panel del administrador.
import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { consultar } from '../../db/pool.js';
import { ZONA_HORARIA } from '../../config/agenda.js';

const hoyChile = `(now() AT TIME ZONE '${ZONA_HORARIA}')::date`;
const r = Router();
r.get('/', autenticar, autorizar('administrador'), async (_req, res) => {
  const { rows: [k] } = await consultar(`
    SELECT
      (SELECT count(*) FROM clientes WHERE estado_servicio = 'activo')::int AS "clientesActivos",
      (SELECT count(*) FROM clientes WHERE estado_servicio = 'cortado')::int AS "clientesCortados",
      (SELECT count(*) FROM visitas WHERE estado = 'solicitada')::int AS "solicitudesPendientes",
      (SELECT count(*) FROM visitas WHERE estado IN ('solicitada','confirmada')
          AND (inicio AT TIME ZONE '${ZONA_HORARIA}')::date = ${hoyChile})::int AS "visitasHoy",
      (SELECT count(*) FROM boletas WHERE estado <> 'pagada')::int AS "boletasPendientes",
      (SELECT COALESCE(sum(monto_clp), 0) FROM boletas WHERE estado <> 'pagada')::int AS "montoPorCobrar"`);
  const { rows: proximas } = await consultar(`
    SELECT v.id, 'VT-' || lpad(v.numero::text, 5, '0') AS codigo, v.tipo, v.estado, c.nombre AS "clienteNombre", c.comuna,
           to_char(v.inicio AT TIME ZONE '${ZONA_HORARIA}', 'YYYY-MM-DD') AS fecha,
           to_char(v.inicio AT TIME ZONE '${ZONA_HORARIA}', 'HH24:MI') AS "horaInicio", t.nombre AS "tecnicoNombre"
      FROM visitas v JOIN clientes c ON c.id = v.cliente_id LEFT JOIN usuarios t ON t.id = v.tecnico_id
     WHERE v.estado IN ('solicitada','confirmada') AND v.inicio >= now() ORDER BY v.inicio LIMIT 6`);
  res.json({ indicadores: k, proximasVisitas: proximas });
});
export default r;
