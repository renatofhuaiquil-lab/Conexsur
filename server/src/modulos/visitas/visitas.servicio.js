// Reglas de negocio del agendamiento técnico (HU-07, HU-08, HU-09).
import { enTransaccion } from '../../db/pool.js';
import { DIAS_ATENCION, HORAS_DISPONIBLES } from '../../config/agenda.js';
import { ErrorApp, conflicto, noEncontrado, prohibido } from '../../utilidades/errores.js';
import { registrarAuditoria } from '../../utilidades/auditoria.js';
import * as repo from './visitas.repositorio.js';

const esDiaDeAtencion = (fecha) => DIAS_ATENCION.includes(new Date(`${fecha}T12:00:00Z`).getUTCDay());

/** Franjas del día con su disponibilidad. No se ofrecen horarios ocupados ni pasados (HU-07, criterio 2). */
export async function consultarDisponibilidad(fecha) {
  if (!esDiaDeAtencion(fecha)) return { fecha, cerrado: true, franjas: [] };
  const [tecnicos, ocupacion, ahora] = await Promise.all([
    repo.contarTecnicosActivos(), repo.ocupacionDelDia(fecha), repo.ahoraChile(),
  ]);
  const usadas = new Map(ocupacion.map((o) => [o.hora, o.n]));
  const franjas = HORAS_DISPONIBLES.map((hora) => ({
    hora,
    disponible: `${fecha} ${hora}` > ahora && (usadas.get(hora) ?? 0) < tecnicos,
  }));
  return { fecha, cerrado: false, franjas };
}

export async function solicitarVisita(usuarioId, { tipo, motivo, fecha, hora }) {
  const cliente = await repo.clienteDeUsuario(usuarioId);
  if (!cliente) throw prohibido('Tu cuenta no está asociada a un cliente.');
  if (!esDiaDeAtencion(fecha)) throw new ErrorApp(400, 'No se atiende ese día.', 'VALIDACION');
  if (`${fecha} ${hora}` <= (await repo.ahoraChile())) throw new ErrorApp(400, 'Debes elegir un horario futuro.', 'VALIDACION');

  return enTransaccion(async (tx) => {
    // Serializa las reservas para que dos solicitudes simultáneas no superen la capacidad de la franja.
    await tx.query(`SELECT pg_advisory_xact_lock(hashtext('agenda_visitas'))`);
    if (await repo.clienteTieneVisitaEn(tx, cliente.id, fecha, hora)) throw conflicto('Ya tienes una visita en ese horario.');
    const capacidad = (await tx.query(`SELECT count(*)::int AS n FROM usuarios WHERE rol = 'tecnico' AND activo`)).rows[0].n;
    if ((await repo.ocupacionFranja(tx, fecha, hora)) >= capacidad) throw conflicto('Ese horario ya no está disponible.');
    const id = await repo.insertar(tx, { clienteId: cliente.id, tipo, motivo, fecha, hora });
    await registrarAuditoria({ usuarioId, accion: 'visita.solicitar', entidad: 'visita', entidadId: id }, tx);
    return repo.buscarPorId(tx, id);
  });
}

/** Calendario: el administrador ve todo; el técnico, solo lo asignado a él (HU-08, criterio 2). */
export const listarCalendario = ({ desde, hasta }, usuario) =>
  repo.listarRango({ desde, hasta, tecnicoId: usuario.rol === 'tecnico' ? usuario.id : null });

export const listarPendientes = () => repo.listarPendientes();

export async function listarMias(usuarioId) {
  const cliente = await repo.clienteDeUsuario(usuarioId);
  return cliente ? repo.listarDeCliente(cliente.id) : [];
}

export async function confirmarVisita(id, tecnicoId, usuarioId) {
  return enTransaccion(async (tx) => {
    const visita = await repo.bloquearPorId(tx, id);
    if (!visita) throw noEncontrado('Visita no encontrada.');
    if (visita.estado !== 'solicitada') throw conflicto('La visita ya no está pendiente.');
    if (!(await repo.tecnicoActivoExiste(tx, tecnicoId))) throw new ErrorApp(400, 'El técnico indicado no existe o está inactivo.', 'VALIDACION');
    try {
      await repo.confirmar(tx, id, tecnicoId);
    } catch (error) {
      // 23P01: la restricción de exclusión de la base detectó un cruce de horario del técnico (HU-09, criterio 2).
      if (error.code === '23P01') throw conflicto('El técnico ya tiene una visita en ese horario.');
      throw error;
    }
    await registrarAuditoria({ usuarioId, accion: 'visita.confirmar', entidad: 'visita', entidadId: id, detalle: { tecnicoId } }, tx);
    return repo.buscarPorId(tx, id);
  });
}
