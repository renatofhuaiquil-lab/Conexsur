// Estructura del panel de administración: barra lateral oscura en escritorio y menú desplegable en móvil.
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import { useAuth } from '../contexto/AuthContexto.jsx';
import { Avatar, Marca } from './ui.jsx';

const ENLACES = [
  { a: '/admin', texto: 'Resumen', icono: LayoutDashboard, fin: true },
  { a: '/admin/clientes', texto: 'Clientes', icono: Users },
  { a: '/admin/calendario', texto: 'Calendario técnico', icono: CalendarDays },
];

function Navegacion({ alNavegar }) {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6"><Marca claro /></div>
      <nav aria-label="Principal" className="flex-1 space-y-1 px-3">
        {ENLACES.map(({ a, texto, icono: Icono, fin }) => (
          <NavLink key={a} to={a} end={fin} onClick={alNavegar}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-white/12 text-white' : 'text-niebla-300 hover:bg-white/6 hover:text-white'}`}>
            <Icono size={18} aria-hidden />{texto}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar nombre={usuario.nombre} tam="sm" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p><p className="text-xs text-niebla-300">Administración</p></div>
          <button onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión" className="rounded-md p-2 text-niebla-300 hover:bg-white/10 hover:text-white"><LogOut size={18} /></button>
        </div>
      </div>
    </div>
  );
}

export default function LayoutAdmin() {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-fiordo-900 lg:block"><Navegacion /></aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-niebla-200 bg-white px-4 py-3 lg:hidden">
        <Marca />
        <button onClick={() => setAbierto(true)} aria-label="Abrir menú" className="rounded-md p-2 hover:bg-niebla-100"><Menu size={22} /></button>
      </header>
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-fiordo-950/50" onClick={() => setAbierto(false)} aria-hidden />
          <aside className="entra-derecha relative h-full w-64 bg-fiordo-900">
            <button onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="absolute right-3 top-4 rounded-md p-1.5 text-niebla-300 hover:bg-white/10"><X size={18} /></button>
            <Navegacion alNavegar={() => setAbierto(false)} />
          </aside>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8"><Outlet /></main>
    </div>
  );
}
