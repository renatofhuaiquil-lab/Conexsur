// Acceso a datos de usuarios para autenticación. Solo SQL, sin reglas de negocio.
import { consultar } from '../../db/pool.js';

export const buscarPorCorreo = async (correo) =>
  (await consultar('SELECT * FROM usuarios WHERE correo = $1', [correo])).rows[0] ?? null;

export const buscarPorId = async (id) =>
  (await consultar('SELECT id, correo, rol, nombre, activo FROM usuarios WHERE id = $1', [id])).rows[0] ?? null;

export const registrarFallo = (id, intentos, bloqueadoHasta) =>
  consultar('UPDATE usuarios SET intentos_fallidos = $2, bloqueado_hasta = $3 WHERE id = $1', [id, intentos, bloqueadoHasta]);

export const registrarAcceso = (id) =>
  consultar('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = now() WHERE id = $1', [id]);
