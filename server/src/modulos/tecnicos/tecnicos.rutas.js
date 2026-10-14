// Lista de técnicos activos, usada al asignar visitas (HU-09).
import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { consultar } from '../../db/pool.js';

const r = Router();
r.get('/', autenticar, autorizar('administrador'), async (_req, res) => {
  const { rows } = await consultar(`SELECT id, nombre FROM usuarios WHERE rol = 'tecnico' AND activo ORDER BY nombre`);
  res.json({ tecnicos: rows });
});
export default r;
