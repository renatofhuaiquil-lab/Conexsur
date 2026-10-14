import { env, esProduccion } from '../../config/env.js';
import { NOMBRE_COOKIE } from '../../middlewares/autenticar.js';
import * as servicio from './auth.servicio.js';

const opcionesCookie = {
  httpOnly: true,          // no accesible desde JavaScript (mitiga XSS)
  secure: esProduccion,    // solo HTTPS en producción
  sameSite: 'strict',      // mitiga CSRF
  path: '/',
};

export async function login(req, res) {
  const { token, usuario } = await servicio.iniciarSesion({ ...req.body, ip: req.ip });
  res.cookie(NOMBRE_COOKIE, token, { ...opcionesCookie, maxAge: env.JWT_EXPIRA_HORAS * 3_600_000 });
  res.json({ usuario });
}

export function logout(_req, res) {
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie);
  res.status(204).end();
}

export async function yo(req, res) {
  res.json({ usuario: await servicio.obtenerUsuarioActual(req.usuario.id) });
}
