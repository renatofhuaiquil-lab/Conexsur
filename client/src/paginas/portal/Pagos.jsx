// HU-13: boleta pendiente con monto, plan y vencimiento. El pago con Mercado Pago (HU-14) se habilita en el siguiente ciclo.
import { AlertTriangle, CreditCard } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useCarga.js';
import { ESTADOS_BOLETA } from '../../lib/etiquetas.js';
import { fechaCorta, peso } from '../../lib/fechas.js';
import { Boton, Cargando, ErrorCaja, Insignia } from '../../componentes/ui.jsx';

const mes = (iso) => { const t = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00`)); return t[0].toUpperCase() + t.slice(1); };
const textoVencimiento = (d) => (d < 0 ? `Venció hace ${-d} ${-d === 1 ? 'día' : 'días'}` : d === 0 ? 'Vence hoy' : `Vence en ${d} ${d === 1 ? 'día' : 'días'}`);

export default function Pagos() {
  const { datos, cargando, error, recargar } = useCarga(() => api.get('/portal/boletas'));
  if (cargando) return <Cargando />;
  if (error) return <ErrorCaja mensaje={error} reintentar={recargar} />;
  const pendiente = datos.boletas.find((b) => b.estado !== 'pagada');
  const historial = datos.boletas.filter((b) => b !== pendiente);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Pagos</h1>

      {pendiente ? (
        <section className="rounded-2xl border border-niebla-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Boleta de {mes(pendiente.periodo).toLowerCase()}</p>
            <Insignia tono={ESTADOS_BOLETA[pendiente.vencida ? 'vencida' : pendiente.estado].tono}>{ESTADOS_BOLETA[pendiente.vencida ? 'vencida' : pendiente.estado].texto}</Insignia>
          </div>
          <p className="mt-3 font-display text-4xl font-bold cifras">{peso(pendiente.montoClp)}</p>
          <p className="mt-1 text-sm text-pizarra-700">Plan {datos.cliente.planNombre} · {datos.cliente.planVelocidadMbps} Mbps</p>
          <p className={`mt-3 inline-flex items-center gap-2 text-sm font-semibold ${pendiente.alerta ? 'text-ambar-600' : 'text-pizarra-700'}`}>
            {pendiente.alerta && <AlertTriangle size={16} aria-hidden />}{textoVencimiento(pendiente.diasRestantes)} · {fechaCorta(pendiente.vencimiento)}
          </p>
          <Boton icono={CreditCard} disabled className="mt-5 w-full">Pagar con Mercado Pago</Boton>
          <p className="mt-2 text-center text-xs text-pizarra-500">El pago en línea estará disponible en el próximo ciclo de desarrollo.</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-niebla-200 bg-white p-5 text-sm text-pizarra-700">No tienes boletas pendientes. ¡Estás al día!</section>
      )}

      <section>
        <h2 className="mb-2 font-display text-base font-semibold">Historial</h2>
        <ul className="divide-y divide-niebla-100 overflow-hidden rounded-2xl border border-niebla-200 bg-white">
          {historial.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div><p className="text-sm font-semibold">{mes(b.periodo)}</p><p className="text-xs text-pizarra-500 cifras">{peso(b.montoClp)}</p></div>
              <Insignia tono={ESTADOS_BOLETA[b.estado].tono}>{ESTADOS_BOLETA[b.estado].texto}</Insignia>
            </li>
          ))}
          {historial.length === 0 && <li className="px-4 py-6 text-center text-sm text-pizarra-500">Sin boletas anteriores.</li>}
        </ul>
      </section>
    </div>
  );
}
