import { Link } from 'react-router-dom';
import { CalendarClock, Plus } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useCarga.js';
import { ESTADOS_VISITA, TIPOS_VISITA } from '../../lib/etiquetas.js';
import { diaCorto, numeroDia } from '../../lib/fechas.js';
import { Cargando, ErrorCaja, Insignia, Vacio } from '../../componentes/ui.jsx';

export default function Visitas() {
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/visitas/mias'));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Mis visitas</h1>
        <Link to="/portal/visitas/nueva" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-lago-600 px-3.5 text-sm font-semibold text-white hover:bg-lago-700"><Plus size={16} aria-hidden />Agendar</Link>
      </div>
      {cargando ? <Cargando /> : error ? <ErrorCaja mensaje={error} reintentar={recargar} /> : datos.visitas.length === 0 ? (
        <div className="rounded-2xl border border-niebla-200 bg-white"><Vacio icono={CalendarClock} titulo="Aún no tienes visitas" texto="Agenda una visita para instalación, soporte o mantención." /></div>
      ) : (
        <ul className="space-y-3">
          {datos.visitas.map((v) => (
            <li key={v.id} className="flex items-center gap-4 rounded-2xl border border-niebla-200 bg-white p-4">
              <div className="w-14 shrink-0 rounded-xl bg-niebla-100 py-2 text-center"><p className="text-xs font-semibold capitalize text-pizarra-500">{diaCorto(v.fecha)}</p><p className="font-display text-2xl font-bold leading-none">{numeroDia(v.fecha)}</p></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{TIPOS_VISITA[v.tipo].texto} · {v.horaInicio}</p>
                <p className="truncate text-xs text-pizarra-500">{v.codigo}{v.tecnicoNombre ? ` · Técnico ${v.tecnicoNombre}` : ' · Técnico por asignar'}</p>
              </div>
              <Insignia tono={ESTADOS_VISITA[v.estado].tono}>{ESTADOS_VISITA[v.estado].texto}</Insignia>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
