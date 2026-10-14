import * as servicio from './visitas.servicio.js';

export const disponibilidad = async (req, res) => res.json(await servicio.consultarDisponibilidad(req.query.fecha));
export const solicitar = async (req, res) => res.status(201).json({ visita: await servicio.solicitarVisita(req.usuario.id, req.body) });
export const calendario = async (req, res) => res.json({ visitas: await servicio.listarCalendario(req.query, req.usuario) });
export const pendientes = async (_req, res) => res.json({ visitas: await servicio.listarPendientes() });
export const mias = async (req, res) => res.json({ visitas: await servicio.listarMias(req.usuario.id) });
export const confirmar = async (req, res) =>
  res.json({ visita: await servicio.confirmarVisita(req.params.id, req.body.tecnicoId, req.usuario.id) });
