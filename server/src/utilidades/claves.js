// Hash de contraseñas con scrypt (incluido en Node, sin dependencias nativas).
// Formato almacenado: scrypt$<salt hex>$<hash hex>
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const LARGO = 64;

export async function hashearClave(clave) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(clave, sal, LARGO);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

export async function verificarClave(clave, almacenado) {
  const [tipo, salHex, hashHex] = String(almacenado).split('$');
  if (tipo !== 'scrypt' || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = await scryptAsync(clave, Buffer.from(salHex, 'hex'), esperado.length);
  return timingSafeEqual(esperado, calculado); // comparación en tiempo constante
}
