/**
 * Interruptor del modo oscuro.
 *
 * Se mantiene en `false` mientras se migran las pantallas al motor de tema: así la app nunca
 * muestra una mezcla de pantallas claras y oscuras. Se pone en `true` en la fase de cierre,
 * cuando todas las pantallas usan los tokens.
 */
export const MODO_OSCURO_ACTIVO = true;
