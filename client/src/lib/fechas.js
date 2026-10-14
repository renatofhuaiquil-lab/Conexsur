// Utilidades de fechas. El servidor entrega fechas como texto local (AAAA-MM-DD) y horas como HH:MM,
// por lo que aquí no se usan zonas horarias del navegador salvo para saber "hoy" en Chile.
const ZONA = 'America/Santiago';
const aFecha = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const aISO = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

export const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
export const sumarDias = (iso, n) => { const f = aFecha(iso); f.setDate(f.getDate() + n); return aISO(f); };
export const lunesDe = (iso) => { const f = aFecha(iso); f.setDate(f.getDate() - ((f.getDay() + 6) % 7)); return aISO(f); };
export const esDomingo = (iso) => aFecha(iso).getDay() === 0;
export const diaCorto = (iso) => ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][aFecha(iso).getDay()];
export const numeroDia = (iso) => aFecha(iso).getDate();
export const fechaLarga = (iso) => new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(aFecha(iso));
export const fechaCorta = (iso) => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(aFecha(iso)).replace('.', '');
export const rangoSemana = (lunes) => `${fechaCorta(lunes)} – ${fechaCorta(sumarDias(lunes, 5))}`;
export const fechaHora = (valor) => (valor ? new Date(valor).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—');
export const saludo = () => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: 'numeric', hour12: false }).format(new Date()));
  return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
};
export const peso = (n) => `$${Number(n).toLocaleString('es-CL')}`;
