import { z } from 'zod';
import { HORAS_DISPONIBLES, TIPOS_VISITA } from '../../config/agenda.js';

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (use AAAA-MM-DD).')
  .refine((f) => !Number.isNaN(Date.parse(`${f}T00:00:00Z`)), 'Fecha inválida.');

export const esquemaSolicitar = z.object({
  tipo: z.enum(TIPOS_VISITA),
  motivo: z.string().trim().min(5, 'Describe brevemente el motivo.').max(300),
  fecha,
  hora: z.enum(HORAS_DISPONIBLES, { message: 'Horario no válido.' }),
});

export const esquemaDisponibilidad = z.object({ fecha });

export const esquemaRango = z.object({ desde: fecha, hasta: fecha }).refine(
  (r) => r.desde <= r.hasta && (Date.parse(r.hasta) - Date.parse(r.desde)) / 86_400_000 <= 31,
  'Rango de fechas inválido (máximo 31 días).');

export const esquemaConfirmar = z.object({ tecnicoId: z.string().uuid('Técnico inválido.') });
export const esquemaIdParam = z.object({ id: z.string().uuid('Identificador inválido.') });
