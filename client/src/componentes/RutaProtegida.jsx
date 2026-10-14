// Guarda de ruta: exige sesión y, opcionalmente, un rol. La autorización real siempre se valida en el servidor.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContexto.jsx';
import { Cargando } from './ui.jsx';

export const rutaInicio = (rol) => ({ administrador: '/admin', tecnico: '/tecnico', cliente: '/portal' }[rol] ?? '/login');

export default function RutaProtegida({ roles }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={rutaInicio(usuario.rol)} replace />;
  return <Outlet />;
}
