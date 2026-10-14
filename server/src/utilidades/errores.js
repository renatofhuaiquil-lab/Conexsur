// Error controlado de la aplicación: lleva un código HTTP y un mensaje seguro para el usuario.
export class ErrorApp extends Error {
  constructor(estado, mensaje, codigo = 'ERROR') {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}
export const noAutenticado = (m = 'Debes iniciar sesión.') => new ErrorApp(401, m, 'NO_AUTENTICADO');
export const prohibido = (m = 'No tienes permisos para esta acción.') => new ErrorApp(403, m, 'PROHIBIDO');
export const noEncontrado = (m = 'Recurso no encontrado.') => new ErrorApp(404, m, 'NO_ENCONTRADO');
export const conflicto = (m) => new ErrorApp(409, m, 'CONFLICTO');
