// HU-04: ficha del cliente con plan, estado del servicio, visitas y pagos.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Mail, Phone, Power } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useCarga.js';
import { ESTADOS_SERVICIO, ESTADOS_VISITA, TIPOS_VISITA } from '../../lib/etiquetas.js';
import { fechaCorta, fechaHora, peso } from '../../lib/fechas.js';
import { Avatar, Boton, Cargando, ErrorCaja, Insignia, Vacio } from '../../componentes/ui.jsx';

export default function FichaCliente() {
  const { id } = useParams();
  const { datos, cargando, error, recargar } = useCarga(() => api.get(`/clientes/${id}`), [id]);
  const [errorAccion, setErrorAccion] = useState('');
  const [cambiando, setCambiando] = useState(false);

  if (cargando) return <Cargando />;
  if (error) return <ErrorCaja mensaje={error} reintentar={recargar} />;
  const c = datos.cliente;
  const activo = c.estadoServicio === 'activo';

  async function cambiarEstado() {
    const nuevo = activo ? 'cortado' : 'activo';
    if (!window.confirm(`¿${activo ? 'Cortar' : 'Reactivar'} el servicio de ${c.nombre}?`)) return;
    setErrorAccion(''); setCambiando(true);
    try { await api.patch(`/clientes/${id}/estado`, { estado: nuevo }); await recargar(); }
    catch (e) { setErrorAccion(e.message); }
    finally { setCambiando(false); }
  }

  return (
    <div className="space-y-5">
      <Link to="/admin/clientes" className="inline-flex items-center gap-1 text-sm font-semibold text-lago-700 hover:underline"><ChevronLeft size={16} aria-hidden />Clientes</Link>

      <section className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-niebla-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <Avatar nombre={c.nombre} tam="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold">{c.nombre}</h1>
            <p className="text-sm text-pizarra-500 cifras">RUT {c.rut}</p>
            <ul className="mt-3 space-y-1 text-sm text-pizarra-700">
              <li className="flex items-center gap-2"><MapPin size={15} className="text-pizarra-500" aria-hidden />{c.direccion}, {c.comuna}</li>
              <li className="flex items-center gap-2"><Phone size={15} className="text-pizarra-500" aria-hidden />{c.telefono ?? 'Sin teléfono'}</li>
              <li className="flex items-center gap-2"><Mail size={15} className="text-pizarra-500" aria-hidden />{c.correo ?? 'Sin correo'}</li>
            </ul>
          </div>
        </div>
        <div className="min-w-56 space-y-2 sm:text-right">
          <Insignia tono={ESTADOS_SERVICIO[c.estadoServicio].tono}>Servicio {ESTADOS_SERVICIO[c.estadoServicio].texto.toLowerCase()}</Insignia>
          <div><Boton variante={activo ? 'peligro' : 'primario'} icono={Power} cargando={cambiando} onClick={cambiarEstado}>{activo ? 'Cortar servicio' : 'Reactivar servicio'}</Boton></div>
          {c.estadoCambiadoEn && <p className="text-xs text-pizarra-500">Último cambio: {fechaHora(c.estadoCambiadoEn)} por {c.estadoCambiadoPor}</p>}
          {errorAccion && <p role="alert" className="text-sm text-copihue-600">{errorAccion}</p>}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <section className="self-start rounded-xl border border-niebla-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold">Plan contratado</h2>
          {c.planNombre ? (
            <>
              <p className="mt-3 font-display text-3xl font-bold cifras">{c.planVelocidadMbps}<span className="ml-1 text-base font-semibold text-pizarra-500">Mbps</span></p>
              <p className="mt-1 text-sm text-pizarra-700">{c.planNombre} · {peso(c.planPrecioClp)} al mes</p>
            </>
          ) : <p className="mt-3 text-sm text-pizarra-500">El cliente no tiene un plan asignado.</p>}
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-xl border border-niebla-200 bg-white">
            <h2 className="border-b border-niebla-200 px-5 py-4 font-display text-base font-semibold">Visitas técnicas</h2>
            {c.visitas.length === 0 ? <Vacio titulo="Sin visitas" texto="Aún no hay visitas registradas." /> : (
              <ul className="divide-y divide-niebla-100">
                {c.visitas.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div><p className="text-sm font-semibold">{TIPOS_VISITA[v.tipo].texto}</p><p className="text-xs text-pizarra-500">{fechaHora(v.inicio)}</p></div>
                    <Insignia tono={ESTADOS_VISITA[v.estado].tono}>{ESTADOS_VISITA[v.estado].texto}</Insignia>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-xl border border-niebla-200 bg-white">
            <h2 className="border-b border-niebla-200 px-5 py-4 font-display text-base font-semibold">Pagos</h2>
            {c.pagos.length === 0 ? <Vacio titulo="Sin pagos" texto="Los pagos con Mercado Pago aparecerán aquí." /> : (
              <ul className="divide-y divide-niebla-100">
                {c.pagos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div><p className="text-sm font-semibold cifras">{peso(p.montoClp)}</p><p className="text-xs text-pizarra-500">{fechaCorta(p.creadoEn.slice(0, 10))}</p></div>
                    <Insignia tono={p.estado === 'aprobado' ? 'verde' : p.estado === 'rechazado' ? 'rojo' : 'ambar'}>{p.estado}</Insignia>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
