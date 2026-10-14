// Carga datos de la API y expone { datos, cargando, error, recargar }.
import { useCallback, useEffect, useState } from 'react';

export function useCarga(funcion, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' });
  const recargar = useCallback(async () => {
    try {
      const datos = await funcion();
      setEstado({ datos, cargando: false, error: '' });
    } catch (e) {
      setEstado({ datos: null, cargando: false, error: e.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
  useEffect(() => { recargar(); }, [recargar]);
  return { ...estado, recargar };
}
