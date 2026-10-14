import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { esquemaConfirmar, esquemaDisponibilidad, esquemaIdParam, esquemaRango, esquemaSolicitar } from './visitas.esquemas.js';
import * as c from './visitas.controlador.js';

const r = Router();
r.use(autenticar);
// Cliente: solicita y consulta sus visitas (HU-07)
r.get('/disponibilidad', autorizar('cliente', 'administrador'), validar(esquemaDisponibilidad, 'query'), c.disponibilidad);
r.post('/', autorizar('cliente'), validar(esquemaSolicitar), c.solicitar);
r.get('/mias', autorizar('cliente'), c.mias);
// Administrador y técnico: calendario semanal (HU-08)
r.get('/', autorizar('administrador', 'tecnico'), validar(esquemaRango, 'query'), c.calendario);
// Administrador: solicitudes pendientes y confirmación con técnico (HU-09)
r.get('/pendientes', autorizar('administrador'), c.pendientes);
r.patch('/:id/confirmar', autorizar('administrador'), validar(esquemaIdParam, 'params'), validar(esquemaConfirmar), c.confirmar);
export default r;
