import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarCheck } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { useAuth } from '../../contexto/AuthContexto.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { ESTADOS_VISITA, TIPOS_VISITA } from '../../lib/etiquetas.js';
import { diaCorto, fechaLarga, hoyISO, numeroDia, peso, saludo } from '../../lib/fechas.js';
import { Cargando, ErrorCaja, Insignia, Vacio } from '../../componentes/ui.jsx';

function Indicador({ etiqueta, valor, detalle, a }) {
  const contenido = (
    <div className="h-full px-5 py-4">
      <p className="text-sm text-pizarra-500">{etiqueta}</p>
      <p className="mt-1 font-display text-3xl font-bold cifras">{valor}</p>
      <p className="mt-0.5 text-xs text-pizarra-500">{detalle}</p>
    </div>
  );
  return a ? <Link to={a} className="block hover:bg-niebla-50">{contenido}</Link> : contenido;
}

export default function Resumen() {
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/resumen'));
  if (cargando) return <Cargando />;
  if (error) return <ErrorCaja mensaje={error} reintentar={recargar} />;
  const { indicadores: k, proximasVisitas } = datos;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{saludo()}, {usuario.nombre.split(' ')[0]}</h1>
        <p className="text-sm text-pizarra-500 first-letter:uppercase">{fechaLarga(hoyISO())}</p>
      </header>

      <section aria-label="Indicadores" className="grid grid-cols-2 divide-x divide-y divide-niebla-200 overflow-hidden rounded-xl border border-niebla-200 bg-white lg:grid-cols-4 lg:divide-y-0">
        <Indicador etiqueta="Visitas de hoy" valor={k.visitasHoy} detalle="Pendientes y confirmadas" a="/admin/calendario" />
        <Indicador etiqueta="Por confirmar" valor={k.solicitudesPendientes} detalle="Solicitudes de clientes" a="/admin/calendario" />
        <Indicador etiqueta="Clientes activos" valor={k.clientesActivos} detalle={`${k.clientesCortados} con servicio cortado`} a="/admin/clientes" />
        <Indicador etiqueta="Por cobrar" valor={peso(k.montoPorCobrar)} detalle={`${k.boletasPendientes} boletas sin pagar`} />
      </section>

      <section className="rounded-xl border border-niebla-200 bg-white">
        <div className="flex items-center justify-between border-b border-niebla-200 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Próximas visitas</h2>
          <Link to="/admin/calendario" className="inline-flex items-center gap-1 text-sm font-semibold text-lago-700 hover:underline">Ver calendario <ArrowUpRight size={16} aria-hidden /></Link>
        </div>
        {proximasVisitas.length === 0 ? (
          <Vacio icono={CalendarCheck} titulo="No hay visitas próximas" texto="Las solicitudes de los clientes aparecerán aquí." />
        ) : (
          <ul className="divide-y divide-niebla-100">
            {proximasVisitas.map((v) => (
              <li key={v.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-xs font-semibold capitalize text-pizarra-500">{diaCorto(v.fecha)}</p>
                  <p className="font-display text-xl font-bold leading-none">{numeroDia(v.fecha)}</p>
                </div>
                <div className="w-14 shrink-0 text-sm font-bold cifras">{v.horaInicio}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{v.clienteNombre}</p>
                  <p className="truncate text-xs text-pizarra-500">{TIPOS_VISITA[v.tipo].texto} · {v.comuna}{v.tecnicoNombre ? ` · ${v.tecnicoNombre}` : ''}</p>
                </div>
                <Insignia tono={ESTADOS_VISITA[v.estado].tono}>{ESTADOS_VISITA[v.estado].texto}</Insignia>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
