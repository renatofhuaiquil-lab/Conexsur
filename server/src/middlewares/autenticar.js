// Verifica la sesión (JWT en cookie httpOnly) y deja el usuario en req.usuario.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { noAutenticado } from '../utilidades/errores.js';

export const NOMBRE_COOKIE = 'sesion';

export function autenticar(req, _res, next) {
  const token = req.cookies?.[NOMBRE_COOKIE];
  if (!token) return next(noAutenticado());
  try {
    const carga = jwt.verify(token, env.JWT_SECRETO, { algorithms: ['HS256'] });
    req.usuario = { id: carga.sub, rol: carga.rol };
    next();
  } catch {
    next(noAutenticado('La sesión expiró. Inicia sesión nuevamente.'));
  }
}
