import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexto/AuthContexto.jsx';
import { rutaInicio } from '../componentes/RutaProtegida.jsx';
import { Boton, Campo, claseInput, Marca } from '../componentes/ui.jsx';

// Cuentas de demostración: solo se muestran en desarrollo (npm run dev), nunca en la versión compilada.
const DEMO = [
  { texto: 'Administración', correo: 'admin@conexsur.cl' },
  { texto: 'Técnico', correo: 'tecnico@conexsur.cl' },
  { texto: 'Cliente', correo: 'cliente@conexsur.cl' },
];

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={rutaInicio(usuario.rol)} replace />;

  async function enviar(e) {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      const u = await iniciarSesion(correo, clave);
      navegar(rutaInicio(u.rol), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-fiordo-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Cordillera estilizada: perfil de montañas del sur, solo decorativa */}
        <svg aria-hidden viewBox="0 0 800 400" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-2/5 w-full">
          <path d="M0 400V250l90-70 70 50 120-120 90 90 80-60 110 110 70-50 170 150v120z" fill="#173b52" />
          <path d="M0 400V320l110-60 90 40 130-90 100 80 120-70 140 90 110-40v130z" fill="#0f2b3d" opacity=".85" />
        </svg>
        <Marca claro tam={34} />
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">Tu internet, tus visitas y tus pagos en un solo lugar.</h1>
          <p className="mt-4 text-base text-niebla-300">Gestión de clientes, agenda técnica y cobros para el servicio de conectividad en el sur de Chile.</p>
        </div>
        <p className="relative text-sm text-niebla-300">Plataforma CONEXSUR</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden"><Marca /></div>
          <div>
            <h2 className="font-display text-2xl font-bold">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-pizarra-500">Ingresa con la cuenta que te entregó CONEXSUR.</p>
          </div>
          <Campo etiqueta="Correo">
            <input type="email" required autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} className={claseInput} placeholder="nombre@correo.cl" />
          </Campo>
          <Campo etiqueta="Clave">
            <div className="relative">
              <input type={verClave ? 'text' : 'password'} required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} className={`${claseInput} pr-11`} />
              <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar clave' : 'Mostrar clave'}
                className="absolute inset-y-0 right-0 px-3 text-pizarra-500 hover:text-pizarra-900">{verClave ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </Campo>
          {error && <p role="alert" className="rounded-lg bg-copihue-50 px-3 py-2 text-sm text-copihue-600">{error}</p>}
          <Boton type="submit" cargando={enviando} icono={LogIn} className="w-full">{enviando ? 'Ingresando…' : 'Ingresar'}</Boton>

          {import.meta.env.DEV && (
            <div className="rounded-lg border border-dashed border-niebla-300 p-3">
              <p className="text-xs font-semibold text-pizarra-500">Cuentas de demostración (clave Demo1234!)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEMO.map((d) => (
                  <button key={d.correo} type="button" onClick={() => { setCorreo(d.correo); setClave('Demo1234!'); }}
                    className="rounded-md bg-niebla-100 px-2.5 py-1 text-xs font-semibold text-pizarra-700 hover:bg-niebla-200">{d.texto}</button>
                ))}
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
