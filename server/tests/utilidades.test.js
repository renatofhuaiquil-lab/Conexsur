import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rutEsValido, normalizarRut, calcularDv } from '../src/utilidades/rut.js';
import { hashearClave, verificarClave } from '../src/utilidades/claves.js';

test('RUT: dígito verificador válido e inválido', () => {
  assert.equal(calcularDv('12345678'), '5');
  assert.ok(rutEsValido('12.345.678-5'));
  assert.ok(rutEsValido('123456785'));
  assert.ok(rutEsValido('7.775.375-K'.replace('K', calcularDv('7775375')))); // construido con el dv calculado
  assert.equal(rutEsValido('12345678-9'), false);
  assert.equal(rutEsValido('abc'), false);
  assert.equal(normalizarRut('12.345.678-5'), '12345678-5');
});

test('Claves: hash distinto cada vez y verificación correcta', async () => {
  const a = await hashearClave('Secreta123!');
  const b = await hashearClave('Secreta123!');
  assert.notEqual(a, b);
  assert.ok(await verificarClave('Secreta123!', a));
  assert.equal(await verificarClave('otra', a), false);
  assert.equal(await verificarClave('x', 'basura'), false);
});
