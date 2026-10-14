// HU-07: solicitud de visita en 3 pasos (motivo, fecha y hora, confirmación).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Cable, Wrench, ShieldCheck } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { TIPOS_VISITA } from '../../lib/etiquetas.js';
import { diaCorto, esDomingo, fechaLarga, hoyISO, numeroDia, sumarDias } from '../../lib/fechas.js';
import { Boton, claseInput, Cargando } from '../../componentes/ui.jsx';

const OPCIONES = [
  { valor: 'soporte', icono: Wrench, descripcion: 'Sin señal, internet lento o fallas del equipo.' },
  { valor: 'instalacion', icono: Cable, descripcion: 'Instalar el servicio en un domicilio nuevo.' },
  { valor: 'mantencion', icono: ShieldCheck, descripcion: 'Revisión preventiva del equipo y la conexión.' },
];

export default function NuevaVisita() {
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState('soporte');
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [franjas, setFranjas] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState(null);
  const eligioDia = useRef(false); // si el cliente aún no eligió un día, se salta hoy cuando ya no quedan horarios

  const dias = useMemo(() => Array.from({ length: 15 }, (_, i) => sumarDias(hoyISO(), i)).filter((d) => !esDomingo(d)), []);
  useEffect(() => { if (!fecha) setFecha(dias[0]); }, [dias, fecha]);
  useEffect(() => {
    if (!fecha) return;
    setFranjas(null); setHora('');
    api.get(`/visitas/disponibilidad?fecha=${fecha}`).then((r) => {
      if (!eligioDia.current && r.franjas.every((f) => !f.disponible) && fecha === dias[0] && dias[1]) { setFecha(dias[1]); return; }
      setFranjas(r.franjas);
    }).catch((e) => setError(e.message));
  }, [fecha, dias]);

  async function confirmar() {
    setError(''); setEnviando(true);
    try {
      const r = await api.post('/visitas', { tipo, motivo: motivo.trim(), fecha, hora });
      setCreada(r.visita);
    } catch (e) {
      setError(e.message);
      if (e.estado === 409) { setPaso(2); setHora(''); api.get(`/visitas/disponibilidad?fecha=${fecha}`).then((r) => setFranjas(r.franjas)); }
    } finally {
      setEnviando(false);
    }
  }

  if (creada) {
    return (
      <div className="space-y-5 pt-6 text-center">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-coihue-50 text-coihue-600"><Check size={32} aria-hidden /></span>
        <div>
          <h1 className="font-display text-2xl font-bold">Solicitud enviada</h1>
          <p className="mt-1 text-sm text-pizarra-500">Tu visita está pendiente de confirmación. Te asignaremos un técnico.</p>
        </div>
        <dl className="rounded-2xl border border-niebla-200 bg-white p-4 text-left text-sm">
          <div className="flex justify-between py-1.5"><dt className="text-pizarra-500">Código</dt><dd className="font-bold cifras">{creada.codigo}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-pizarra-500">Tipo</dt><dd className="font-semibold">{TIPOS_VISITA[creada.tipo].texto}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-pizarra-500">Fecha</dt><dd className="font-semibold first-letter:uppercase">{fechaLarga(creada.fecha)}</dd></div>
          <div className="flex justify-between py-1.5"><dt className="text-pizarra-500">Horario</dt><dd className="font-semibold cifras">{creada.horaInicio} a {creada.horaFin}</dd></div>
        </dl>
        <Link to="/portal/visitas" className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-fiordo-900 px-4 text-sm font-semibold text-white">Ver mis visitas</Link>
      </div>
    );
  }

  const puedeSeguir1 = motivo.trim().length >= 5;
  return (
    <div className="space-y-5">
      <div>
        <Link to="/portal/visitas" className="inline-flex items-center gap-1 text-sm font-semibold text-lago-700"><ChevronLeft size={16} aria-hidden />Mis visitas</Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Agendar visita</h1>
        <p className="text-sm text-pizarra-500">Paso {paso} de 3</p>
        <div className="mt-2 flex gap-1.5" aria-hidden>{[1, 2, 3].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= paso ? 'bg-lago-600' : 'bg-niebla-200'}`} />)}</div>
      </div>

      {paso === 1 && (
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">¿Qué necesitas?</legend>
            {OPCIONES.map(({ valor, icono: Icono, descripcion }) => (
              <label key={valor} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 ${tipo === valor ? 'border-lago-600 bg-lago-50' : 'border-niebla-200 bg-white'}`}>
                <input type="radio" name="tipo" value={valor} checked={tipo === valor} onChange={() => setTipo(valor)} className="sr-only" />
                <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${tipo === valor ? 'bg-lago-600 text-white' : 'bg-niebla-100 text-pizarra-700'}`}><Icono size={20} aria-hidden /></span>
                <span><span className="block text-sm font-semibold">{TIPOS_VISITA[valor].texto}</span><span className="block text-xs text-pizarra-500">{descripcion}</span></span>
              </label>
            ))}
          </fieldset>
          <label className="block text-sm font-semibold">Cuéntanos el motivo
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} maxLength={300} placeholder="Ejemplo: no tengo internet desde ayer en la tarde." className={`${claseInput} mt-1.5`} />
          </label>
          <Boton className="w-full" disabled={!puedeSeguir1} onClick={() => setPaso(2)}>Continuar</Boton>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">Elige el día</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="Día">
              {dias.map((d) => (
                <button key={d} role="radio" aria-checked={d === fecha} onClick={() => { eligioDia.current = true; setFecha(d); }}
                  className={`w-14 shrink-0 rounded-xl border py-2 text-center ${d === fecha ? 'border-fiordo-900 bg-fiordo-900 text-white' : 'border-niebla-200 bg-white'}`}>
                  <span className="block text-[11px] font-semibold capitalize">{diaCorto(d)}</span><span className="block font-display text-xl font-bold">{numeroDia(d)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Elige la hora</p>
            {!franjas ? <Cargando texto="Buscando horarios…" /> : (
              <>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Hora">
                  {franjas.map((f) => (
                    <button key={f.hora} role="radio" aria-checked={f.hora === hora} disabled={!f.disponible} onClick={() => setHora(f.hora)}
                      className={`rounded-xl border py-2.5 text-sm font-semibold cifras ${f.hora === hora ? 'border-lago-600 bg-lago-600 text-white' : 'border-niebla-200 bg-white'} disabled:border-niebla-100 disabled:bg-niebla-100 disabled:text-pizarra-500/60 disabled:line-through`}>{f.hora}</button>
                  ))}
                </div>
                {franjas.every((f) => !f.disponible) && <p className="mt-2 text-sm text-pizarra-500">No quedan horarios este día. Prueba con otro día.</p>}
              </>
            )}
          </div>
          {error && <p role="alert" className="rounded-lg bg-copihue-50 px-3 py-2 text-sm text-copihue-600">{error}</p>}
          <div className="flex gap-2"><Boton variante="borde" onClick={() => { setError(''); setPaso(1); }}>Atrás</Boton><Boton className="flex-1" disabled={!hora} onClick={() => { setError(''); setPaso(3); }}>Continuar</Boton></div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-4">
          <dl className="rounded-2xl border border-niebla-200 bg-white p-4 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-pizarra-500">Tipo</dt><dd className="font-semibold">{TIPOS_VISITA[tipo].texto}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-pizarra-500">Día</dt><dd className="font-semibold first-letter:uppercase">{fechaLarga(fecha)}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-pizarra-500">Hora</dt><dd className="font-semibold cifras">{hora}</dd></div>
            <div className="py-1.5"><dt className="text-pizarra-500">Motivo</dt><dd className="mt-0.5">{motivo}</dd></div>
          </dl>
          {error && <p role="alert" className="rounded-lg bg-copihue-50 px-3 py-2 text-sm text-copihue-600">{error}</p>}
          <div className="flex gap-2"><Boton variante="borde" onClick={() => setPaso(2)}>Atrás</Boton><Boton className="flex-1" cargando={enviando} onClick={confirmar}>Confirmar solicitud</Boton></div>
        </div>
      )}
    </div>
  );
}
