import type { ViewStyle } from 'react-native';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/theme';

/**
 * Tokens semánticos de diseño (claro y oscuro).
 *
 * REGLA: ninguna pantalla ni componente define colores propios; todo sale de aquí.
 * Los pares de color están validados por contraste (WCAG) en claro y oscuro.
 * Excepción conocida: texto blanco sobre el verde de marca del encabezado (2.5:1, texto grande y en negrita).
 */

export type ModoTema = 'claro' | 'oscuro';

export interface Colores {
  // Fondos y superficies
  fondo: string;
  fondoSuave: string;
  superficie: string;
  superficieElevada: string;
  // Bordes
  borde: string;
  bordeSuave: string;
  bordeFuerte: string;
  divisor: string;
  // Texto
  texto: string;
  textoSuave: string;
  textoTenue: string;
  textoInverso: string;
  // Marca
  primario: string; // verde de marca: encabezado, iconos, acentos
  primarioFuerte: string; // fondo de botones (contraste AA con `sobrePrimario`)
  primarioTexto: string; // texto y enlaces en verde sobre superficie
  primarioSuave: string; // fondos tenues de marca
  primarioBorde: string;
  sobrePrimario: string; // texto sobre `primarioFuerte`
  secundario: string;
  secundarioSuave: string;
  // Estados (fondo suave + texto + punto)
  exito: string;
  exitoSuave: string;
  exitoTexto: string;
  aviso: string;
  avisoSuave: string;
  avisoTexto: string;
  error: string;
  errorSuave: string;
  errorTexto: string;
  info: string;
  infoSuave: string;
  infoTexto: string;
  neutro: string;
  neutroSuave: string;
  neutroTexto: string;
  // Series de gráficas (categóricas, en orden fijo). Validadas con el script de `dataviz`.
  serie1: string; // efectivo
  serie2: string; // transferencia
  // Controles
  deshabilitado: string;
  textoDeshabilitado: string;
  placeholder: string;
  // Encabezado y superposiciones
  encabezado: string;
  sobreEncabezado: string;
  encabezadoControl: string; // fondo translúcido de botones sobre el encabezado
  overlay: string;
  blanco: string;
}

export interface Tema {
  modo: ModoTema;
  esOscuro: boolean;
  colores: Colores;
}

const claro: Colores = {
  fondo: '#f6f8f7',
  fondoSuave: '#eef2f0',
  superficie: '#ffffff',
  superficieElevada: '#ffffff',
  borde: '#e3e8e6',
  bordeSuave: '#eef2f0',
  bordeFuerte: '#cbd4d0',
  divisor: 'rgba(15, 35, 28, 0.08)',
  texto: '#16211d',
  textoSuave: '#56635e',
  textoTenue: '#69766f',
  textoInverso: '#ffffff',
  primario: '#00b894',
  primarioFuerte: '#00856a',
  primarioTexto: '#00765d',
  primarioSuave: '#e6f7f2',
  primarioBorde: 'rgba(0, 184, 148, 0.35)',
  sobrePrimario: '#ffffff',
  secundario: '#0b6fc2',
  secundarioSuave: '#e7f1fb',
  exito: '#00b894',
  exitoSuave: '#e3f6f0',
  exitoTexto: '#00694f',
  aviso: '#f39c12',
  avisoSuave: '#fff4dc',
  avisoTexto: '#7a4f00',
  error: '#d64533',
  errorSuave: '#fdeaea',
  errorTexto: '#b3261e',
  info: '#3498db',
  infoSuave: '#e6f1fc',
  infoTexto: '#175c9f',
  neutro: '#7d8a85',
  neutroSuave: '#eef1f0',
  neutroTexto: '#46534d',
  serie1: '#00a383',
  serie2: '#2a78d6',
  deshabilitado: '#e9eeec',
  textoDeshabilitado: '#9aa6a1',
  placeholder: '#7d8a85',
  encabezado: '#00b894',
  sobreEncabezado: '#ffffff',
  encabezadoControl: 'rgba(255, 255, 255, 0.2)',
  overlay: 'rgba(10, 20, 17, 0.5)',
  blanco: '#ffffff',
};

const oscuro: Colores = {
  fondo: '#0e1311',
  fondoSuave: '#131a17',
  superficie: '#171e1b',
  superficieElevada: '#1d2623',
  borde: '#27322e',
  bordeSuave: '#1f2a26',
  bordeFuerte: '#3a4843',
  divisor: 'rgba(255, 255, 255, 0.08)',
  texto: '#e9f0ed',
  textoSuave: '#a7b4ae',
  textoTenue: '#8a9791',
  textoInverso: '#0e1311',
  primario: '#2fd1a9',
  primarioFuerte: '#1fbf98',
  primarioTexto: '#4ee0bb',
  primarioSuave: '#12302a',
  primarioBorde: 'rgba(47, 209, 169, 0.4)',
  sobrePrimario: '#03231b',
  secundario: '#6fb4f0',
  secundarioSuave: '#122a3f',
  exito: '#2fd1a9',
  exitoSuave: '#12302a',
  exitoTexto: '#5fe0bf',
  aviso: '#f2b13d',
  avisoSuave: '#352a0f',
  avisoTexto: '#f2c066',
  error: '#ff6b5e',
  errorSuave: '#3a1717',
  errorTexto: '#ff8d86',
  info: '#6fb4f0',
  infoSuave: '#122a3f',
  infoTexto: '#7fbcf0',
  neutro: '#8a9791',
  neutroSuave: '#222b28',
  neutroTexto: '#b4c0ba',
  serie1: '#20a784',
  serie2: '#4a94de',
  deshabilitado: '#222b28',
  textoDeshabilitado: '#5d6a64',
  placeholder: '#8a9791',
  encabezado: '#0f2e27',
  sobreEncabezado: '#e9f0ed',
  encabezadoControl: 'rgba(255, 255, 255, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  blanco: '#ffffff',
};

export const temaClaro: Tema = { modo: 'claro', esOscuro: false, colores: claro };
export const temaOscuro: Tema = { modo: 'oscuro', esOscuro: true, colores: oscuro };

/** Alto mínimo táctil recomendado (iOS/Android). */
export const ALTURA_TACTIL = 44;

export type NivelSombra = 'sm' | 'md' | 'lg';

/**
 * Sombras finas. En oscuro no se usan: la separación la dan el borde y la superficie elevada.
 */
export function sombra(tema: Tema, nivel: NivelSombra = 'sm'): ViewStyle {
  if (tema.esOscuro) return {};
  const mapa: Record<NivelSombra, ViewStyle> = {
    sm: {
      shadowColor: '#0f231c',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#0f231c',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#0f231c',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  };
  return mapa[nivel];
}

export { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING };
