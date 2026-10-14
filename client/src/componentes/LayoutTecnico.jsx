import { LogOut } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContexto.jsx';
import { Avatar, Marca } from './ui.jsx';

export default function LayoutTecnico() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-fiordo-900 px-4 py-3 sm:px-8">
        <Marca claro />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-niebla-300 sm:inline">{usuario.nombre}</span>
          <Avatar nombre={usuario.nombre} tam="sm" />
          <button onClick={cerrarSesion} aria-label="Cerrar sesión" className="rounded-md p-2 text-niebla-300 hover:bg-white/10 hover:text-white"><LogOut size={18} /></button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8"><Outlet /></main>
    </div>
  );
}
