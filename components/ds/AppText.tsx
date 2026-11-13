import { FONT_SIZE, FONT_WEIGHT, useTheme } from '@/theme';
import { Text, type TextProps, type TextStyle } from 'react-native';

export type VarianteTexto = 'titulo' | 'subtitulo' | 'cuerpo' | 'etiqueta' | 'nota' | 'numero';
export type TonoTexto = 'normal' | 'suave' | 'tenue' | 'primario' | 'error' | 'exito' | 'aviso' | 'inverso';

const VARIANTES: Record<VarianteTexto, TextStyle> = {
  titulo: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, lineHeight: 30 },
  subtitulo: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.semibold, lineHeight: 24 },
  cuerpo: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.regular, lineHeight: 21 },
  etiqueta: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, lineHeight: 18 },
  nota: { fontSize: FONT_SIZE.footnote, fontWeight: FONT_WEIGHT.regular, lineHeight: 17 },
  numero: { fontSize: FONT_SIZE.title2, fontWeight: FONT_WEIGHT.bold, lineHeight: 26 },
};

interface AppTextProps extends TextProps {
  variante?: VarianteTexto;
  tono?: TonoTexto;
}

/** Texto con tipografía y color del tema. Evita definir fontSize/color en cada pantalla. */
export function AppText({ variante = 'cuerpo', tono = 'normal', style, ...resto }: AppTextProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const color: Record<TonoTexto, string> = {
    normal: c.texto,
    suave: c.textoSuave,
    tenue: c.textoTenue,
    primario: c.primarioTexto,
    error: c.errorTexto,
    exito: c.exitoTexto,
    aviso: c.avisoTexto,
    inverso: c.textoInverso,
  };
  return <Text {...resto} style={[VARIANTES[variante], { color: color[tono] }, style]} />;
}
