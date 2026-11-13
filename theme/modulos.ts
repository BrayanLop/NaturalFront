/**
 * Colores de identidad de cada módulo de la pantalla de inicio.
 * Son colores de marca (no cambian entre tema claro y oscuro: el icono va en blanco sobre el círculo).
 */
export const COLORES_MODULO = {
  personas: '#0984e3',
  servicios: '#e67e22',
  configServicios: '#9b59b6',
  configuracion: '#34495e',
  registrar: '#00b894',
  pagos: '#16a085',
  finanzas: '#3498db',
  historico: '#9b59b6',
} as const;

/** Colores de los accesos de "Ver detalle" en Finanzas. */
export const COLORES_DETALLE = {
  consolidado: '#3498db',
  formasPago: '#1abc9c',
  ingresos: '#27ae60',
  egresos: '#e74c3c',
  historico: '#8e44ad',
} as const;
