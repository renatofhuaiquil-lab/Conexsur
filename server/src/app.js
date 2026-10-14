// Construye la aplicación Express (sin abrir el puerto, para poder probarla).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { verificarOrigen } from './middlewares/origen.js';
import { manejarErrores, rutaNoEncontrada } from './middlewares/errores.js';
import { consultar } from './db/pool.js';
import authRutas from './modulos/auth/auth.rutas.js';
import clientesRutas from './modulos/clientes/clientes.rutas.js';
import planesRutas from './modulos/planes/planes.rutas.js';
import visitasRutas from './modulos/visitas/visitas.rutas.js';
import tecnicosRutas from './modulos/tecnicos/tecnicos.rutas.js';
import portalRutas from './modulos/portal/portal.rutas.js';
import resumenRutas from './modulos/resumen/resumen.rutas.js';

export function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // detrás de Nginx: toma la IP real del cliente
  app.use(helmet());
  app.use(cors({ origin: env.ORIGEN_CLIENTE, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.use(verificarOrigen);
  api.get('/salud', async (_req, res) => {
    await consultar('SELECT 1');
    res.json({ estado: 'ok' });
  });
  api.use('/auth', authRutas);
  api.use('/clientes', clientesRutas);
  api.use('/planes', planesRutas);
  api.use('/visitas', visitasRutas);
  api.use('/tecnicos', tecnicosRutas);
  api.use('/portal', portalRutas);
  api.use('/resumen', resumenRutas);
  app.use('/api', api);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}
