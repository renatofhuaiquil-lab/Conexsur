import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida, { rutaInicio } from './componentes/RutaProtegida.jsx';
import LayoutAdmin from './componentes/LayoutAdmin.jsx';
import LayoutTecnico from './componentes/LayoutTecnico.jsx';
import LayoutPortal from './componentes/LayoutPortal.jsx';
import { useAuth } from './contexto/AuthContexto.jsx';
import Login from './paginas/Login.jsx';
import Resumen from './paginas/admin/Resumen.jsx';
import Clientes from './paginas/admin/Clientes.jsx';
import FichaCliente from './paginas/admin/FichaCliente.jsx';
import CalendarioAdmin from './paginas/admin/CalendarioAdmin.jsx';
import AgendaTecnico from './paginas/tecnico/AgendaTecnico.jsx';
import Inicio from './paginas/portal/Inicio.jsx';
import Visitas from './paginas/portal/Visitas.jsx';
import NuevaVisita from './paginas/portal/NuevaVisita.jsx';
import Pagos from './paginas/portal/Pagos.jsx';

function Raiz() {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return <Navigate to={usuario ? rutaInicio(usuario.rol) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RutaProtegida roles={['administrador']} />}>
        <Route element={<LayoutAdmin />}>
          <Route path="/admin" element={<Resumen />} />
          <Route path="/admin/clientes" element={<Clientes />} />
          <Route path="/admin/clientes/:id" element={<FichaCliente />} />
          <Route path="/admin/calendario" element={<CalendarioAdmin />} />
        </Route>
      </Route>
      <Route element={<RutaProtegida roles={['tecnico']} />}>
        <Route element={<LayoutTecnico />}>
          <Route path="/tecnico" element={<AgendaTecnico />} />
        </Route>
      </Route>
      <Route element={<RutaProtegida roles={['cliente']} />}>
        <Route element={<LayoutPortal />}>
          <Route path="/portal" element={<Inicio />} />
          <Route path="/portal/visitas" element={<Visitas />} />
          <Route path="/portal/visitas/nueva" element={<NuevaVisita />} />
          <Route path="/portal/pagos" element={<Pagos />} />
        </Route>
      </Route>
      <Route path="*" element={<Raiz />} />
    </Routes>
  );
}
