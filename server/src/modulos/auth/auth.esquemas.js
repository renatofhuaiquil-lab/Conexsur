import { z } from 'zod';

export const esquemaLogin = z.object({
  correo: z.string().trim().email('Correo inválido.').max(254),
  clave: z.string().min(1, 'La clave es obligatoria.').max(200),
});
