// Portal del cliente: pensado primero para teléfono. En escritorio se centra en una columna angosta.
import { CalendarClock, Home, LogOut, Receipt } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContexto.jsx';
import { Marca } from './ui.jsx';

const PESTANAS = [
  { a: '/portal', texto: 'Inicio', icono: Home, fin: true },
  { a: '/portal/visitas', texto: 'Visitas', icono: CalendarClock },
  { a: '/portal/pagos', texto: 'Pagos', icono: Receipt },
];

export default function LayoutPortal() {
  const { cerrarSesion } = useAuth();
  return (
    <div className="min-h-screen bg-niebla-100">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-niebla-50 shadow-xl shadow-fiordo-900/5">
        <header className="flex items-center justify-between px-5 pb-2 pt-4">
          <Marca />
          <button onClick={cerrarSesion} aria-label="Cerrar sesión" className="rounded-md p-2 text-pizarra-500 hover:bg-niebla-100"><LogOut size={18} /></button>
        </header>
        <main className="flex-1 px-5 pb-28 pt-2"><Outlet /></main>
        <nav aria-label="Principal" className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-3 border-t border-niebla-200 bg-white/95 pb-2 pt-1 backdrop-blur">
          {PESTANAS.map(({ a, texto, icono: Icono, fin }) => (
            <NavLink key={a} to={a} end={fin}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-semibold ${isActive ? 'text-lago-700' : 'text-pizarra-500'}`}>
              <Icono size={22} aria-hidden />{texto}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
