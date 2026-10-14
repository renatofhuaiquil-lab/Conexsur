// Textos y colores de los estados. Siempre se muestra texto junto al color (accesibilidad).
export const TIPOS_VISITA = {
  instalacion: { texto: 'Instalación', barra: 'bg-lago-600', suave: 'bg-lago-50 text-lago-700' },
  soporte: { texto: 'Soporte', barra: 'bg-lluvia-600', suave: 'bg-lluvia-50 text-lluvia-600' },
  mantencion: { texto: 'Mantención', barra: 'bg-ambar-600', suave: 'bg-ambar-50 text-ambar-600' },
};
export const ESTADOS_VISITA = {
  solicitada: { texto: 'Pendiente', tono: 'ambar' },
  confirmada: { texto: 'Confirmada', tono: 'lago' },
  realizada: { texto: 'Realizada', tono: 'gris' },
  cancelada: { texto: 'Cancelada', tono: 'rojo' },
};
export const ESTADOS_SERVICIO = {
  activo: { texto: 'Activo', tono: 'verde' },
  cortado: { texto: 'Cortado', tono: 'rojo' },
};
export const ESTADOS_BOLETA = {
  pendiente: { texto: 'Pendiente', tono: 'ambar' },
  vencida: { texto: 'Vencida', tono: 'rojo' },
  pagada: { texto: 'Pagada', tono: 'verde' },
};
