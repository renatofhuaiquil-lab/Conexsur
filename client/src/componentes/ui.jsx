// Componentes de interfaz reutilizables: botón, insignia, avatar, campos, estados vacíos y panel lateral.
import { useEffect, useRef } from 'react';
import { Loader2, X } from 'lucide-react';

const BOTON = {
  primario: 'bg-lago-600 text-white hover:bg-lago-700 disabled:bg-niebla-300 disabled:text-pizarra-500',
  oscuro: 'bg-fiordo-900 text-white hover:bg-fiordo-800 disabled:bg-niebla-300 disabled:text-pizarra-500',
  borde: 'border border-niebla-300 bg-white text-pizarra-900 hover:bg-niebla-50 disabled:text-pizarra-500',
  peligro: 'border border-copihue-600/30 bg-white text-copihue-600 hover:bg-copihue-50',
  fantasma: 'text-pizarra-700 hover:bg-niebla-100',
};
export function Boton({ variante = 'primario', icono: Icono, cargando = false, className = '', children, ...props }) {
  return (
    <button {...props} disabled={props.disabled || cargando}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${BOTON[variante]} ${className}`}>
      {cargando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : Icono && <Icono size={16} aria-hidden />}
      {children}
    </button>
  );
}

const TONOS = {
  verde: 'bg-coihue-50 text-coihue-600', rojo: 'bg-copihue-50 text-copihue-600', ambar: 'bg-ambar-50 text-ambar-600',
  lago: 'bg-lago-50 text-lago-700', gris: 'bg-niebla-100 text-pizarra-700',
};
export function Insignia({ tono = 'gris', children }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[tono]}`}>
    <span className="size-1.5 rounded-full bg-current" aria-hidden />{children}</span>;
}

export function Avatar({ nombre, tam = 'md' }) {
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const tamano = tam === 'lg' ? 'size-14 text-lg' : tam === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm';
  return <span aria-hidden className={`inline-flex ${tamano} shrink-0 items-center justify-center rounded-full bg-fiordo-800 font-display font-semibold text-white`}>{iniciales}</span>;
}

export function Campo({ etiqueta, ayuda, error, children }) {
  return (
    <label className="block text-sm font-medium text-pizarra-900">
      {etiqueta}
      <div className="mt-1.5">{children}</div>
      {ayuda && !error && <p className="mt-1 text-xs font-normal text-pizarra-500">{ayuda}</p>}
      {error && <p className="mt-1 text-xs font-normal text-copihue-600">{error}</p>}
    </label>
  );
}
export const claseInput = 'w-full rounded-lg border border-niebla-300 bg-white px-3 py-2.5 text-sm text-pizarra-900 placeholder:text-pizarra-500/70 focus:border-lago-500';

export function Cargando({ texto = 'Cargando…' }) {
  return <div role="status" className="flex items-center gap-2 p-6 text-sm text-pizarra-500"><Loader2 size={16} className="animate-spin" aria-hidden />{texto}</div>;
}
export function ErrorCaja({ mensaje, reintentar }) {
  return (
    <div role="alert" className="m-4 rounded-lg border border-copihue-600/25 bg-copihue-50 p-4 text-sm text-copihue-600">
      <p className="font-semibold">No se pudo cargar la información.</p>
      <p className="mt-1">{mensaje}</p>
      {reintentar && <Boton variante="borde" className="mt-3" onClick={reintentar}>Reintentar</Boton>}
    </div>
  );
}
export function Vacio({ icono: Icono, titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icono && <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-niebla-100 text-pizarra-500"><Icono size={22} aria-hidden /></span>}
      <p className="font-display text-base font-semibold">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-pizarra-500">{texto}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Panel lateral deslizante (detalle de visita, formulario de cliente). Se cierra con Escape. */
export function Panel({ titulo, subtitulo, onCerrar, children }) {
  const botonCerrar = useRef(null);
  useEffect(() => {
    botonCerrar.current?.focus();
    const alTeclear = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-fiordo-950/45" onClick={onCerrar} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={titulo} className="entra-derecha relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-niebla-200 px-5 py-4">
          <div><h2 className="font-display text-lg font-semibold">{titulo}</h2>{subtitulo && <p className="text-sm text-pizarra-500">{subtitulo}</p>}</div>
          <button ref={botonCerrar} onClick={onCerrar} aria-label="Cerrar" className="rounded-md p-1.5 text-pizarra-500 hover:bg-niebla-100"><X size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}

export function Marca({ claro = false, tam = 28 }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={tam} height={tam} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill={claro ? '#14938c' : '#0f2b3d'} />
        <path d="M7 21a11 11 0 0 1 18 0M10.5 21a6.5 6.5 0 0 1 11 0" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="22" r="1.9" fill="#fff" />
      </svg>
      <span className={`font-display text-lg font-bold tracking-tight ${claro ? 'text-white' : 'text-fiordo-900'}`}>CONEXSUR</span>
    </span>
  );
}
