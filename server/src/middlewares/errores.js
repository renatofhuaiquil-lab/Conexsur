// Manejo centralizado de errores: nunca se filtran detalles internos al cliente.
import { ErrorApp } from '../utilidades/errores.js';
import { esProduccion } from '../config/env.js';

export function rutaNoEncontrada(_req, _res, next) {
  next(new ErrorApp(404, 'Ruta no encontrada.', 'NO_ENCONTRADO'));
}

// eslint-disable-next-line no-unused-vars
export function manejarErrores(err, req, res, _next) {
  if (err instanceof ErrorApp) {
    return res.status(err.estado).json({ error: { codigo: err.codigo, mensaje: err.message, detalle: err.detalle } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo de la solicitud no es JSON válido.' } });
  }
  console.error('Error no controlado:', req.method, req.originalUrl, esProduccion ? err.message : err);
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado.' } });
}
