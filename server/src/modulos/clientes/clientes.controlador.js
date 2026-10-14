import * as servicio from './clientes.servicio.js';

export const listar = async (_req, res) => res.json({ clientes: await servicio.listarClientes() });

export const crear = async (req, res) =>
  res.status(201).json({ cliente: await servicio.registrarCliente(req.body, req.usuario.id) });

export const ficha = async (req, res) => res.json({ cliente: await servicio.obtenerFicha(req.params.id) });

export const cambiarEstado = async (req, res) =>
  res.json({ cliente: await servicio.cambiarEstadoServicio(req.params.id, req.body.estado, req.usuario.id) });
