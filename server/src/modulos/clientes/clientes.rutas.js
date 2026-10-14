import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { esquemaCrearCliente, esquemaCambiarEstado, esquemaIdParam } from './clientes.esquemas.js';
import * as c from './clientes.controlador.js';

const r = Router();
r.use(autenticar, autorizar('administrador')); // todo el CRM es solo para administración
r.get('/', c.listar);
r.post('/', validar(esquemaCrearCliente), c.crear);
r.get('/:id', validar(esquemaIdParam, 'params'), c.ficha);
r.patch('/:id/estado', validar(esquemaIdParam, 'params'), validar(esquemaCambiarEstado), c.cambiarEstado);
export default r;
