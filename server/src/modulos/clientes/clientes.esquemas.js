import { z } from 'zod';
import { normalizarRut, rutEsValido } from '../../utilidades/rut.js';

export const esquemaCrearCliente = z.object({
  rut: z.string().trim().refine(rutEsValido, 'RUT inválido.').transform(normalizarRut),
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().trim().max(30).optional(),
  correo: z.string().trim().email().max(254).optional(),
  direccion: z.string().trim().min(3).max(200),
  comuna: z.string().trim().min(2).max(80),
  planId: z.string().uuid().optional(),
});

export const esquemaCambiarEstado = z.object({
  estado: z.enum(['activo', 'cortado']),
});

export const esquemaIdParam = z.object({ id: z.string().uuid('Identificador inválido.') });
