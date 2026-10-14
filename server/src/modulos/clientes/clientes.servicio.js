// Reglas de negocio del CRM (HU-03, HU-04).
import { enTransaccion } from '../../db/pool.js';
import { conflicto, noEncontrado } from '../../utilidades/errores.js';
import { registrarAuditoria } from '../../utilidades/auditoria.js';
import * as repo from './clientes.repositorio.js';

export const listarClientes = () => repo.listar();

export async function registrarCliente(datos, usuarioId) {
  try {
    const cliente = await repo.crear(datos);
    await registrarAuditoria({ usuarioId, accion: 'cliente.crear', entidad: 'cliente', entidadId: cliente.id });
    return cliente;
  } catch (error) {
    if (error.code === '23505') throw conflicto('Ya existe un cliente con ese RUT.'); // unique_violation
    if (error.code === '23503') throw conflicto('El plan indicado no existe.');       // foreign_key_violation
    throw error;
  }
}

export async function obtenerFicha(id) {
  const cliente = await repo.buscarFicha(id);
  if (!cliente) throw noEncontrado('Cliente no encontrado.');
  const [visitas, pagos] = await Promise.all([repo.ultimasVisitas(id), repo.ultimosPagos(id)]);
  return { ...cliente, visitas, pagos };
}

export async function cambiarEstadoServicio(id, estado, usuarioId) {
  return enTransaccion(async (tx) => {
    const actualizado = await repo.actualizarEstado(tx, id, estado, usuarioId);
    if (!actualizado) throw noEncontrado('Cliente no encontrado.');
    await registrarAuditoria({ usuarioId, accion: 'cliente.cambiar_estado', entidad: 'cliente', entidadId: id, detalle: { estado } }, tx);
    return actualizado;
  });
}
