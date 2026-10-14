// Restringe una ruta a ciertos roles (RF-02). Uso: autorizar('administrador', 'tecnico')
import { prohibido } from '../utilidades/errores.js';

export const autorizar = (...rolesPermitidos) => (req, _res, next) =>
  rolesPermitidos.includes(req.usuario?.rol) ? next() : next(prohibido());
