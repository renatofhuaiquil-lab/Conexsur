// HU-03: registro de clientes y listado. Enlaza a la ficha (HU-04).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Users } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useCarga.js';
import { ESTADOS_SERVICIO } from '../../lib/etiquetas.js';
import { Avatar, Boton, Campo, Cargando, claseInput, ErrorCaja, Insignia, Panel, Vacio } from '../../componentes/ui.jsx';

const VACIO = { rut: '', nombre: '', telefono: '', correo: '', direccion: '', comuna: '', planId: '' };

function FormularioCliente({ planes, onCerrar, onCreado }) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const poner = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function guardar(e) {
    e.preventDefault();
    setErrores({}); setErrorGeneral(''); setEnviando(true);
    const cuerpo = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== '')); // no se envían opcionales vacíos
    try {
      await api.post('/clientes', cuerpo);
      onCreado();
    } catch (err) {
      if (err.detalle) setErrores(Object.fromEntries(err.detalle.map((d) => [d.campo, d.mensaje])));
      else setErrorGeneral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Panel titulo="Nuevo cliente" subtitulo="Registra los datos del servicio" onCerrar={onCerrar}>
      <form onSubmit={guardar} className="space-y-4">
        <Campo etiqueta="RUT" ayuda="Con o sin puntos. Ejemplo: 12.345.678-5" error={errores.rut}><input required value={form.rut} onChange={poner('rut')} className={claseInput} /></Campo>
        <Campo etiqueta="Nombre completo" error={errores.nombre}><input required value={form.nombre} onChange={poner('nombre')} className={claseInput} /></Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Teléfono" error={errores.telefono}><input value={form.telefono} onChange={poner('telefono')} className={claseInput} placeholder="+56 9 1234 5678" /></Campo>
          <Campo etiqueta="Correo" error={errores.correo}><input type="email" value={form.correo} onChange={poner('correo')} className={claseInput} /></Campo>
        </div>
        <Campo etiqueta="Dirección" error={errores.direccion}><input required value={form.direccion} onChange={poner('direccion')} className={claseInput} /></Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Comuna" error={errores.comuna}><input required value={form.comuna} onChange={poner('comuna')} className={claseInput} /></Campo>
          <Campo etiqueta="Plan" error={errores.planId}>
            <select value={form.planId} onChange={poner('planId')} className={claseInput}>
              <option value="">Sin plan</option>
              {planes.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.velocidadMbps} Mbps</option>)}
            </select>
          </Campo>
        </div>
        {errorGeneral && <p role="alert" className="rounded-lg bg-copihue-50 px-3 py-2 text-sm text-copihue-600">{errorGeneral}</p>}
        <div className="flex gap-2 pt-2">
          <Boton type="submit" cargando={enviando} icono={UserPlus} className="flex-1">Guardar cliente</Boton>
          <Boton type="button" variante="borde" onClick={onCerrar}>Cancelar</Boton>
        </div>
      </form>
    </Panel>
  );
}

export default function Clientes() {
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const clientes = useCarga(() => api.get('/clientes'));
  const planes = useCarga(() => api.get('/planes'));
  const lista = clientes.datos?.clientes ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-pizarra-500">{clientes.datos ? `${lista.length} clientes registrados` : 'Cargando…'}</p>
        </div>
        <Boton icono={Plus} onClick={() => setAbierto(true)}>Nuevo cliente</Boton>
      </header>

      <section className="overflow-hidden rounded-xl border border-niebla-200 bg-white">
        {clientes.cargando ? <Cargando /> : clientes.error ? <ErrorCaja mensaje={clientes.error} reintentar={clientes.recargar} /> : lista.length === 0 ? (
          <Vacio icono={Users} titulo="Aún no hay clientes" texto="Registra el primer cliente para ver su ficha y agendar visitas.">
            <Boton icono={Plus} onClick={() => setAbierto(true)}>Nuevo cliente</Boton>
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-niebla-200 bg-niebla-50 text-xs font-semibold text-pizarra-500">
                <tr><th className="px-5 py-3">Cliente</th><th className="px-3 py-3">Comuna</th><th className="px-3 py-3">Plan</th><th className="px-5 py-3">Servicio</th></tr>
              </thead>
              <tbody className="divide-y divide-niebla-100">
                {lista.map((c) => (
                  <tr key={c.id} onClick={() => navegar(`/admin/clientes/${c.id}`)} className="cursor-pointer hover:bg-niebla-50">
                    <td className="px-5 py-3">
                      <Link to={`/admin/clientes/${c.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                        <Avatar nombre={c.nombre} />
                        <span><span className="block font-semibold text-pizarra-900">{c.nombre}</span><span className="block text-xs text-pizarra-500 cifras">{c.rut}</span></span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-pizarra-700">{c.comuna}</td>
                    <td className="px-3 py-3 text-pizarra-700">{c.plan ?? '—'}</td>
                    <td className="px-5 py-3"><Insignia tono={ESTADOS_SERVICIO[c.estadoServicio].tono}>{ESTADOS_SERVICIO[c.estadoServicio].texto}</Insignia></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {abierto && <FormularioCliente planes={planes.datos?.planes ?? []} onCerrar={() => setAbierto(false)} onCreado={() => { setAbierto(false); clientes.recargar(); }} />}
    </div>
  );
}
