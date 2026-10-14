// Registro de auditoría: quién hizo qué y cuándo. Acepta un cliente de transacción opcional.
import { consultar } from '../db/pool.js';

export async function registrarAuditoria({ usuarioId = null, accion, entidad, entidadId = null, detalle = null, ip = null }, ejecutor = { query: consultar }) {
  await ejecutor.query(
    `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuarioId, accion, entidad, entidadId, detalle ? JSON.stringify(detalle) : null, ip],
  );
}
