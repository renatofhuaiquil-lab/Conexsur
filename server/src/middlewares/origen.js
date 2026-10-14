// Defensa CSRF adicional: en métodos que modifican datos exige que el Origin sea el del cliente web.
// Se suma a la cookie SameSite y a que la API solo acepta JSON.
import { env } from '../config/env.js';
import { prohibido } from '../utilidades/errores.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function verificarOrigen(req, _res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  // El webhook de Mercado Pago llega sin Origin del navegador y se valida por firma.
  if (req.path.startsWith('/pagos/webhook')) return next();
  const origen = req.get('origin');
  if (origen && origen !== env.ORIGEN_CLIENTE) return next(prohibido('Origen no permitido.'));
  next();
}
