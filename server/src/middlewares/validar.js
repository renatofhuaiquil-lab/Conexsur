// Valida body, query o params con un esquema zod. Reemplaza el valor por el dato ya limpio.
import { ErrorApp } from '../utilidades/errores.js';

export const validar = (esquema, origen = 'body') => (req, _res, next) => {
  const r = esquema.safeParse(req[origen]);
  if (!r.success) {
    const detalle = r.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
    const e = new ErrorApp(400, 'Datos inválidos.', 'VALIDACION');
    e.detalle = detalle;
    return next(e);
  }
  // En Express 5 req.query es de solo lectura; se redefine para entregar el dato ya validado.
  Object.defineProperty(req, origen, { value: r.data, writable: true, configurable: true, enumerable: true });
  next();
};
