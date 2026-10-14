import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { autenticar } from '../../middlewares/autenticar.js';
import { validar } from '../../middlewares/validar.js';
import { esquemaLogin } from './auth.esquemas.js';
import * as c from './auth.controlador.js';

// Límite por IP para frenar fuerza bruta (se suma al bloqueo por cuenta).
const limiteLogin = rateLimit({
  windowMs: 15 * 60_000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiados intentos. Espera unos minutos.' } },
});

const r = Router();
r.post('/login', limiteLogin, validar(esquemaLogin), c.login);
r.post('/logout', c.logout);
r.get('/me', autenticar, c.yo);
export default r;
