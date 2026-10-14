// HU-12: plan y estado del servicio. HU-13: alerta de boleta por vencer.
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, ChevronRight, Receipt, Wifi, WifiOff } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { useAuth } from '../../contexto/AuthContexto.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { ESTADOS_VISITA, TIPOS_VISITA } from '../../lib/etiquetas.js';
import { diaCorto, fechaCorta, numeroDia, peso } from '../../lib/fechas.js';
import { Boton, Cargando, ErrorCaja, Insignia } from '../../componentes/ui.jsx';

const textoVencimiento = (d) => (d < 0 ? `Venció hace ${-d} ${-d === 1 ? 'día' : 'días'}` : d === 0 ? 'Vence hoy' : `Vence en ${d} ${d === 1 ? 'día' : 'días'}`);

export default function Inicio() {
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/portal/inicio'));
  if (cargando) return <Cargando />;
  if (error) return <ErrorCaja mensaje={error} reintentar={recargar} />;
  const { cliente, boletaPendiente: boleta, proximaVisita: visita } = datos;
  const activo = cliente.estadoServicio === 'activo';

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Hola, {usuario.nombre.split(' ')[0]}</h1>

      <section className={`rounded-2xl p-5 text-white ${activo ? 'bg-fiordo-900' : 'bg-copihue-600'}`} aria-label="Estado del servicio">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">{activo ? <Wifi size={18} aria-hidden /> : <WifiOff size={18} aria-hidden />}Servicio {activo ? 'activo' : 'cortado'}</span>
          <span className="text-xs text-white/75">{cliente.comuna}</span>
        </div>
        {cliente.planNombre ? (
          <p className="mt-4 font-display text-5xl font-bold cifras">{cliente.planVelocidadMbps}<span className="ml-1.5 text-lg font-semibold text-white/75">Mbps</span></p>
        ) : <p className="mt-4 text-lg font-semibold">Sin plan asignado</p>}
        <p className="mt-1 text-sm text-white/80">{cliente.planNombre ? `${cliente.planNombre} · ${peso(cliente.planPrecioClp)} al mes` : 'Contacta a CONEXSUR para contratar un plan.'}</p>
        {!activo && (
          <div className="mt-4 rounded-xl bg-white/15 p-3 text-sm">
            <p className="font-semibold">Tu servicio está cortado.</p>
            <p className="mt-0.5 text-white/85">Paga tu boleta pendiente para reactivarlo.</p>
            <Link to="/portal/pagos" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-copihue-600">Ir a pagar</Link>
          </div>
        )}
      </section>

      {boleta ? (
        <Link to="/portal/pagos" className={`block rounded-2xl border p-4 ${boleta.alerta ? 'border-ambar-600/40 bg-ambar-50' : 'border-niebla-200 bg-white'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`inline-flex size-10 items-center justify-center rounded-full ${boleta.alerta ? 'bg-ambar-600 text-white' : 'bg-niebla-100 text-pizarra-700'}`}>{boleta.alerta ? <AlertTriangle size={20} aria-hidden /> : <Receipt size={20} aria-hidden />}</span>
              <div>
                <p className="text-sm font-semibold">{boleta.alerta ? (boleta.vencida ? 'Boleta vencida' : 'Tu boleta está por vencer') : 'Próxima boleta'}</p>
                <p className="text-xs text-pizarra-700">{textoVencimiento(boleta.diasRestantes)} · {fechaCorta(boleta.vencimiento)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1"><span className="font-display text-xl font-bold cifras">{peso(boleta.montoClp)}</span><ChevronRight size={18} className="text-pizarra-500" aria-hidden /></div>
          </div>
        </Link>
      ) : (
        <section className="rounded-2xl border border-niebla-200 bg-white p-4 text-sm text-pizarra-700">No tienes boletas pendientes.</section>
      )}

      <section aria-label="Próxima visita" className="rounded-2xl border border-niebla-200 bg-white p-4">
        <h2 className="font-display text-base font-semibold">Próxima visita técnica</h2>
        {visita ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="w-14 rounded-xl bg-niebla-100 py-2 text-center"><p className="text-xs font-semibold capitalize text-pizarra-500">{diaCorto(visita.fecha)}</p><p className="font-display text-2xl font-bold leading-none">{numeroDia(visita.fecha)}</p></div>
            <div className="flex-1"><p className="text-sm font-semibold">{TIPOS_VISITA[visita.tipo].texto} · {visita.hora}</p><p className="text-xs text-pizarra-500">Código {visita.codigo}</p></div>
            <Insignia tono={ESTADOS_VISITA[visita.estado].tono}>{ESTADOS_VISITA[visita.estado].texto}</Insignia>
          </div>
        ) : (
          <div className="mt-2"><p className="text-sm text-pizarra-500">No tienes visitas agendadas.</p>
            <Link to="/portal/visitas/nueva" className="mt-3 inline-flex"><Boton icono={CalendarClock} className="pointer-events-none">Agendar visita</Boton></Link></div>
        )}
      </section>
    </div>
  );
}
