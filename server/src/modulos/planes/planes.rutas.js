// Lista de planes activos (base del catálogo; la administración completa queda para HU-17).
import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { consultar } from '../../db/pool.js';

const r = Router();
r.get('/', autenticar, async (_req, res) => {
  const { rows } = await consultar(
    `SELECT id, nombre, velocidad_mbps AS "velocidadMbps", precio_clp AS "precioClp"
       FROM planes WHERE activo ORDER BY precio_clp`);
  res.json({ planes: rows });
});
export default r;
