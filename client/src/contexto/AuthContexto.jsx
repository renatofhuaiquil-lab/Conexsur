// Estado de sesión del usuario para toda la aplicación.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/cliente.js';

const AuthContexto = createContext(null);
export const useAuth = () => useContext(AuthContexto);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app se consulta si ya existe una sesión válida (cookie).
  useEffect(() => {
    api.get('/auth/me').then((r) => setUsuario(r.usuario)).catch(() => setUsuario(null)).finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback(async (correo, clave) => {
    const r = await api.post('/auth/login', { correo, clave });
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    await api.post('/auth/logout');
    setUsuario(null);
  }, []);

  return (
    <AuthContexto.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContexto.Provider>
  );
}
