// Calendario técnico semanal (HU-08). En pantallas anchas es una grilla día × hora; en teléfono, una agenda por día.
import { Fragment, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { api } from '../api/cliente.js';
import { useCarga } from '../hooks/useCarga.js';
import { ESTADOS_VISITA, TIPOS_VISITA } from '../lib/etiquetas.js';
import { diaCorto, fechaLarga, hoyISO, lunesDe, numeroDia, rangoSemana, sumarDias } from '../lib/fechas.js';
import { Boton, Cargando, ErrorCaja, Insignia, Vacio } from './ui.jsx';
import DetalleVisita from './DetalleVisita.jsx';

const HORAS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

function iniciales(nombre) { return nombre.split(' ').map((p) => p[0]).slice(0, 2).join(''); }

function Bloque({ v, alAbrir }) {
  const tipo = TIPOS_VISITA[v.tipo];
  const pendiente = v.estado === 'solicitada';
  return (
    <button onClick={() => alAbrir(v)} title={`${v.codigo} · ${tipo.texto} · ${ESTADOS_VISITA[v.estado].texto}`}
      className={`flex w-full overflow-hidden rounded-md text-left text-xs transition-shadow hover:shadow-md ${pendiente ? 'border border-dashed border-ambar-600/60 bg-ambar-50' : v.estado === 'realizada' ? 'border border-niebla-200 bg-niebla-100 text-pizarra-700' : 'border border-niebla-200 bg-white'}`}>
      <span className={`w-1 shrink-0 ${tipo.barra}`} aria-hidden />
      <span className="min-w-0 flex-1 px-2 py-1.5">
        <span className="block truncate font-semibold">{v.clienteNombre}</span>
        <span className="flex items-center justify-between gap-1 text-pizarra-500">
          <span className="truncate">{tipo.texto} · {v.comuna}</span>
          {v.tecnicoNombre && <span className="shrink-0 rounded bg-fiordo-800 px-1 font-semibold text-white" title={v.tecnicoNombre}>{iniciales(v.tecnicoNombre)}</span>}
        </span>
        {pendiente && <span className="mt-0.5 block font-semibold text-ambar-600">Por confirmar</span>}
      </span>
    </button>
  );
}

function Leyenda() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-pizarra-700">
      {Object.values(TIPOS_VISITA).map((t) => <li key={t.texto} className="flex items-center gap-1.5"><span className={`size-2.5 rounded-sm ${t.barra}`} aria-hidden />{t.texto}</li>)}
      <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-ambar-600 bg-ambar-50" aria-hidden />Pendiente</li>
    </ul>
  );
}

export default function CalendarioSemanal({ esAdmin }) {
  const hoy = hoyISO();
  const [lunes, setLunes] = useState(lunesDe(hoy));
  const [dia, setDia] = useState(hoy >= lunes && hoy <= sumarDias(lunes, 5) ? hoy : lunes); // día seleccionado en móvil
  const [abierta, setAbierta] = useState(null);
  const dias = useMemo(() => Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i)), [lunes]);

  const semana = useCarga(() => api.get(`/visitas?desde=${lunes}&hasta=${sumarDias(lunes, 5)}`), [lunes]);
  const pendientes = useCarga(() => (esAdmin ? api.get('/visitas/pendientes') : Promise.resolve({ visitas: [] })), [esAdmin]);
  const tecnicos = useCarga(() => (esAdmin ? api.get('/tecnicos') : Promise.resolve({ tecnicos: [] })), [esAdmin]);

  const visitas = semana.datos?.visitas ?? [];
  const porCelda = (fecha, hora) => visitas.filter((v) => v.fecha === fecha && v.horaInicio === hora);
  const cambiarSemana = (n) => { const nuevo = sumarDias(lunes, 7 * n); setLunes(nuevo); setDia(nuevo); };
  const irAHoy = () => { setLunes(lunesDe(hoy)); setDia(hoy); };
  const alActualizar = () => { setAbierta(null); semana.recargar(); pendientes.recargar(); };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{esAdmin ? 'Calendario técnico' : 'Mi agenda'}</h1>
          <p className="text-sm text-pizarra-500">Semana del {rangoSemana(lunes)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="borde" onClick={irAHoy}>Hoy</Boton>
          <Boton variante="borde" onClick={() => cambiarSemana(-1)} aria-label="Semana anterior" className="px-2.5"><ChevronLeft size={18} /></Boton>
          <Boton variante="borde" onClick={() => cambiarSemana(1)} aria-label="Semana siguiente" className="px-2.5"><ChevronRight size={18} /></Boton>
        </div>
      </header>
      <Leyenda />

      <div className={`grid gap-5 ${esAdmin ? 'xl:grid-cols-[1fr_17rem]' : ''}`}>
        <div className="min-w-0">
          {semana.cargando && !semana.datos ? <Cargando /> : semana.error ? <ErrorCaja mensaje={semana.error} reintentar={semana.recargar} /> : (
            <>
              {/* Grilla semanal (tablet y escritorio) */}
              <div className="hidden overflow-hidden rounded-xl border border-niebla-200 bg-white md:block">
                <div className="grid grid-cols-[3.5rem_repeat(6,minmax(0,1fr))] border-b border-niebla-200 bg-niebla-50">
                  <div />
                  {dias.map((d) => (
                    <div key={d} className={`px-2 py-2.5 text-center ${d === hoy ? 'bg-lago-50' : ''}`}>
                      <p className="text-xs font-semibold capitalize text-pizarra-500">{diaCorto(d)}</p>
                      <p className={`font-display text-lg font-bold ${d === hoy ? 'text-lago-700' : ''}`}>{numeroDia(d)}</p>
                    </div>
                  ))}
                </div>
                {HORAS.map((hora) => (
                  <Fragment key={hora}>
                  {hora === '14:00' && <div className="border-b border-niebla-100 bg-niebla-50 py-0.5 text-center text-[11px] font-semibold text-pizarra-500">Colación (13:00 a 14:00)</div>}
                  <div className="grid grid-cols-[3.5rem_repeat(6,minmax(0,1fr))] border-b border-niebla-100 last:border-b-0">
                    <div className="px-2 pt-2 text-right text-xs font-semibold text-pizarra-500 cifras">{hora}</div>
                    {dias.map((d) => (
                      <div key={d} className={`min-h-[4.75rem] space-y-1 border-l border-niebla-100 p-1 ${d === hoy ? 'bg-lago-50/40' : ''}`}>
                        {porCelda(d, hora).map((v) => <Bloque key={v.id} v={v} alAbrir={setAbierta} />)}
                      </div>
                    ))}
                  </div>
                  </Fragment>
                ))}
              </div>

              {/* Agenda por día (teléfono) */}
              <div className="md:hidden">
                <div className="mb-3 grid grid-cols-6 gap-1" role="tablist" aria-label="Días de la semana">
                  {dias.map((d) => (
                    <button key={d} role="tab" aria-selected={d === dia} onClick={() => setDia(d)}
                      className={`rounded-lg py-2 text-center ${d === dia ? 'bg-fiordo-900 text-white' : 'bg-white text-pizarra-700'}`}>
                      <span className="block text-[11px] font-semibold capitalize">{diaCorto(d)}</span>
                      <span className="block font-display text-base font-bold">{numeroDia(d)}</span>
                      <span className={`mx-auto mt-0.5 block size-1.5 rounded-full ${visitas.some((v) => v.fecha === d) ? (d === dia ? 'bg-white' : 'bg-lago-500') : 'bg-transparent'}`} aria-hidden />
                    </button>
                  ))}
                </div>
                <p className="mb-2 text-sm font-semibold first-letter:uppercase">{fechaLarga(dia)}</p>
                {visitas.filter((v) => v.fecha === dia).length === 0 ? (
                  <div className="rounded-xl border border-niebla-200 bg-white"><Vacio icono={CalendarCheck} titulo="Sin visitas este día" texto="Cuando haya visitas asignadas aparecerán aquí." /></div>
                ) : (
                  <ul className="space-y-2">
                    {visitas.filter((v) => v.fecha === dia).map((v) => (
                      <li key={v.id} className="flex gap-3">
                        <span className="w-12 pt-2 text-right text-sm font-bold cifras">{v.horaInicio}</span>
                        <div className="flex-1"><Bloque v={v} alAbrir={setAbierta} /></div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {esAdmin && (
          <aside aria-label="Solicitudes por confirmar" className="rounded-xl border border-niebla-200 bg-white">
            <div className="flex items-center justify-between border-b border-niebla-200 px-4 py-3">
              <h2 className="font-display text-base font-semibold">Por confirmar</h2>
              <Insignia tono={(pendientes.datos?.visitas.length ?? 0) > 0 ? 'ambar' : 'gris'}>{pendientes.datos?.visitas.length ?? 0}</Insignia>
            </div>
            {(pendientes.datos?.visitas.length ?? 0) === 0 ? (
              <Vacio icono={Inbox} titulo="Todo al día" texto="No hay solicitudes pendientes." />
            ) : (
              <ul className="max-h-[32rem] divide-y divide-niebla-100 overflow-y-auto">
                {pendientes.datos.visitas.map((v) => (
                  <li key={v.id}>
                    <button onClick={() => setAbierta(v)} className="w-full px-4 py-3 text-left hover:bg-niebla-50">
                      <p className="text-sm font-semibold">{v.clienteNombre}</p>
                      <p className="text-xs text-pizarra-500"><span className="capitalize">{diaCorto(v.fecha)} {numeroDia(v.fecha)}</span> · {v.horaInicio} · {TIPOS_VISITA[v.tipo].texto}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>

      {abierta && <DetalleVisita visita={abierta} esAdmin={esAdmin} tecnicos={tecnicos.datos?.tecnicos ?? []} onCerrar={() => setAbierta(null)} onActualizada={alActualizar} />}
    </div>
  );
}
