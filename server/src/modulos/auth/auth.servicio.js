// Reglas de negocio de la autenticación (HU-01 / RF-01 / RF-02).
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { hashearClave, verificarClave } from '../../utilidades/claves.js';
import { ErrorApp, noAutenticado } from '../../utilidades/errores.js';
import { registrarAuditoria } from '../../utilidades/auditoria.js';
import * as repo from './auth.repositorio.js';

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;
const MENSAJE_GENERICO = 'Correo o clave incorrectos.'; // no revela si el correo existe

// Hash falso para igualar el tiempo de respuesta cuando el correo no existe.
const hashFalso = await hashearClave('clave-falsa-para-igualar-tiempos');

export async function iniciarSesion({ correo, clave, ip }) {
  const usuario = await repo.buscarPorCorreo(correo);

  if (!usuario || !usuario.activo) {
    await verificarClave(clave, hashFalso);
    await registrarAuditoria({ accion: 'auth.login_fallido', entidad: 'usuario', detalle: { motivo: 'desconocido_o_inactivo' }, ip });
    throw noAutenticado(MENSAJE_GENERICO);
  }

  if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
    throw new ErrorApp(429, 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.', 'BLOQUEADO');
  }

  if (!(await verificarClave(clave, usuario.clave_hash))) {
    const intentos = usuario.intentos_fallidos + 1;
    const bloquear = intentos >= MAX_INTENTOS;
    await repo.registrarFallo(
      usuario.id,
      bloquear ? 0 : intentos,
      bloquear ? new Date(Date.now() + MINUTOS_BLOQUEO * 60_000) : null,
    );
    await registrarAuditoria({ usuarioId: usuario.id, accion: bloquear ? 'auth.cuenta_bloqueada' : 'auth.login_fallido', entidad: 'usuario', entidadId: usuario.id, ip });
    throw noAutenticado(MENSAJE_GENERICO);
  }

  await repo.registrarAcceso(usuario.id);
  await registrarAuditoria({ usuarioId: usuario.id, accion: 'auth.login', entidad: 'usuario', entidadId: usuario.id, ip });

  const token = jwt.sign({ rol: usuario.rol }, env.JWT_SECRETO, {
    algorithm: 'HS256',
    subject: usuario.id,
    expiresIn: `${env.JWT_EXPIRA_HORAS}h`,
  });
  return { token, usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol } };
}

export async function obtenerUsuarioActual(id) {
  const usuario = await repo.buscarPorId(id);
  if (!usuario || !usuario.activo) throw noAutenticado();
  return usuario;
}
