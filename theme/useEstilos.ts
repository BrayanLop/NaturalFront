import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import type { Tema } from './tokens';

type Estilos = Record<string, ViewStyle | TextStyle | ImageStyle>;

/**
 * Estilos que dependen del tema (claro/oscuro).
 *
 * Uso: define la fábrica FUERA del componente (a nivel de módulo) para que sea estable:
 *
 *   const crearEstilos = (t: Tema) => ({ caja: { backgroundColor: t.colores.superficie } });
 *   const estilos = useEstilos(crearEstilos);
 */
export function useEstilos<T extends Estilos>(fabrica: (tema: Tema) => T): T {
  const { tema } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(fabrica(tema)) as unknown as T, [tema]);
}
