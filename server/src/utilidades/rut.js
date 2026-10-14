// Utilidades para el RUT chileno (RF-04): normalización y validación del dígito verificador (módulo 11).

/** Devuelve el RUT en formato "12345678-5" (sin puntos, guion, K en mayúscula) o null si no es parseable. */
export function normalizarRut(entrada) {
  const limpio = String(entrada).replace(/[.\s]/g, '').toUpperCase();
  const m = /^(\d{7,8})-?([\dK])$/.exec(limpio);
  return m ? `${m[1]}-${m[2]}` : null;
}

export function calcularDv(cuerpo) {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

export function rutEsValido(entrada) {
  const rut = normalizarRut(entrada);
  if (!rut) return false;
  const [cuerpo, dv] = rut.split('-');
  return calcularDv(cuerpo) === dv;
}
