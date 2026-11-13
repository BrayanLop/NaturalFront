import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

export type TonoBadge = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  tone?: TonoBadge;
  /** Punto de color antes del texto (el color nunca es el único indicador: siempre hay texto). */
  dot?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Estado sutil: fondo tenue + texto del mismo tono + punto de color.
 * Reemplaza los bloques de color sólido (el "verde fuerte").
 */
export function Badge({ label, tone = 'neutral', dot = true, size = 'md' }: BadgeProps) {
  const { tema } = useTheme();
  const c = tema.colores;

  const paleta = {
    success: { fondo: c.exitoSuave, texto: c.exitoTexto, punto: c.exito },
    warning: { fondo: c.avisoSuave, texto: c.avisoTexto, punto: c.aviso },
    error: { fondo: c.errorSuave, texto: c.errorTexto, punto: c.error },
    info: { fondo: c.infoSuave, texto: c.infoTexto, punto: c.info },
    neutral: { fondo: c.neutroSuave, texto: c.neutroTexto, punto: c.neutro },
    primary: { fondo: c.primarioSuave, texto: c.primarioTexto, punto: c.primario },
  }[tone];

  return (
    <View
      style={[estilos.base, size === 'sm' && estilos.chica, { backgroundColor: paleta.fondo }]}
      accessible
      accessibilityLabel={label}
    >
      {dot ? <View style={[estilos.punto, { backgroundColor: paleta.punto }]} /> : null}
      <Text style={[estilos.texto, size === 'sm' && estilos.textoChico, { color: paleta.texto }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  chica: { paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  punto: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  texto: { fontSize: FONT_SIZE.footnote, fontWeight: FONT_WEIGHT.semibold },
  textoChico: { fontSize: FONT_SIZE.caption },
});
