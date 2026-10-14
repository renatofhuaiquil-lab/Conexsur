// Panel con el detalle de una visita. El administrador puede asignar técnico y confirmar (HU-09).
import { useState } from 'react';
import { CheckCircle2, MapPin, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { ESTADOS_VISITA, TIPOS_VISITA } from '../lib/etiquetas.js';
import { fechaLarga } from '../lib/fechas.js';
import { Boton, Campo, claseInput, Insignia, Panel } from './ui.jsx';

function Dato({ etiqueta, children }) {
  return <div className="py-3 first:pt-0"><dt className="text-xs font-semibold text-pizarra-500">{etiqueta}</dt><dd className="mt-0.5 text-sm">{children}</dd></div>;
}

export default function DetalleVisita({ visita, esAdmin, tecnicos, onCerrar, onActualizada }) {
  const [tecnicoId, setTecnicoId] = useState(tecnicos?.[0]?.id ?? '');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const tipo = TIPOS_VISITA[visita.tipo];
  const estado = ESTADOS_VISITA[visita.estado];

  async function confirmar() {
    setError(''); setEnviando(true);
    try {
      await api.patch(`/visitas/${visita.id}/confirmar`, { tecnicoId });
      onActualizada();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Panel titulo={`Visita ${visita.codigo}`} subtitulo={tipo.texto} onCerrar={onCerrar}>
      <div className="mb-4 flex items-center gap-2">
        <Insignia tono={estado.tono}>{estado.texto}</Insignia>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tipo.suave}`}>{tipo.texto}</span>
      </div>
      <dl className="divide-y divide-niebla-200">
        <Dato etiqueta="Cliente">
          {esAdmin ? <Link to={`/admin/clientes/${visita.clienteId}`} className="font-semibold text-lago-700 hover:underline">{visita.clienteNombre}</Link> : <span className="font-semibold">{visita.clienteNombre}</span>}
        </Dato>
        <Dato etiqueta="Dirección"><span className="inline-flex items-start gap-1.5"><MapPin size={15} className="mt-0.5 shrink-0 text-pizarra-500" aria-hidden />{visita.direccion}, {visita.comuna}</span></Dato>
        <Dato etiqueta="Fecha y hora"><span className="inline-block first-letter:uppercase">{fechaLarga(visita.fecha)}</span>, {visita.horaInicio} a {visita.horaFin}</Dato>
        <Dato etiqueta="Motivo">{visita.motivo}</Dato>
        <Dato etiqueta="Técnico">{visita.tecnicoNombre ? <span className="inline-flex items-center gap-1.5"><UserRound size={15} className="text-pizarra-500" aria-hidden />{visita.tecnicoNombre}</span> : <span className="text-pizarra-500">Sin asignar</span>}</Dato>
      </dl>

      {esAdmin && visita.estado === 'solicitada' && (
        <div className="mt-6 space-y-4 rounded-lg bg-niebla-50 p-4">
          <p className="text-sm font-semibold">Asignar técnico y confirmar</p>
          <Campo etiqueta="Técnico">
            <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)} className={claseInput}>
              {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Campo>
          {error && <p role="alert" className="rounded-lg bg-copihue-50 px-3 py-2 text-sm text-copihue-600">{error}</p>}
          <Boton icono={CheckCircle2} cargando={enviando} onClick={confirmar} className="w-full">Confirmar visita</Boton>
        </div>
      )}
    </Panel>
  );
}
