// Carga y valida las variables de entorno una sola vez al iniciar.
// Si falta algo crítico, el servidor no arranca (falla rápido y de forma explícita).
import { z } from 'zod';

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().min(0).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRETO: z.string().min(32, 'JWT_SECRETO debe tener al menos 32 caracteres'),
  JWT_EXPIRA_HORAS: z.coerce.number().positive().default(8),
  ORIGEN_CLIENTE: z.string().url().default('http://localhost:5173'),
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRETO: z.string().optional(),
});

const resultado = esquema.safeParse(process.env);
if (!resultado.success) {
  console.error('Configuración inválida:', resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = resultado.data;
export const esProduccion = env.NODE_ENV === 'production';
