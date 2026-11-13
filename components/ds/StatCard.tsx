import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useTheme } from '@/theme';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';

export type TonoStat = 'primary' | 'success' | 'error' | 'info' | 'neutral';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: TonoStat;
  /** `soft`: tarjeta blanca con icono de color. `solid`: tarjeta verde destacada (cifra principal). */
  variant?: 'soft' | 'solid';
  style?: StyleProp<ViewStyle>;
}

/** Indicador (KPI): una cifra, su nombre y una pista corta. */
export function StatCard({ label, value, hint, icon, tone = 'primary', variant = 'soft', style }: StatCardProps) {
  const { tema } = useTheme();
  const c = tema.colores;

  if (variant === 'solid') {
    return (
      <View style={[estilos.base, { backgroundColor: c.primarioFuerte, borderColor: c.primarioFuerte }, sombra(tema, 'md'), style]}>
        <View style={estilos.cabecera}>
          {icon ? <Icon name={icon} size={18} color={c.sobrePrimario} /> : null}
          <Text style={[estilos.etiqueta, { color: c.sobrePrimario, opacity: 0.9 }, icon ? estilos.conIcono : null]}>{label}</Text>
        </View>
        <Text style={[estilos.valorGrande, { color: c.sobrePrimario }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {hint ? <Text style={[estilos.pista, { color: c.sobrePrimario, opacity: 0.85 }]}>{hint}</Text> : null}
      </View>
    );
  }

  const paleta = {
    primary: { fondo: c.primarioSuave, texto: c.primarioTexto },
    success: { fondo: c.exitoSuave, texto: c.exitoTexto },
    error: { fondo: c.errorSuave, texto: c.errorTexto },
    info: { fondo: c.infoSuave, texto: c.infoTexto },
    neutral: { fondo: c.neutroSuave, texto: c.neutroTexto },
  }[tone];

  return (
    <View style={[estilos.base, { backgroundColor: c.superficie, borderColor: c.borde }, sombra(tema, 'sm'), style]}>
      {icon ? (
        <View style={[estilos.circulo, { backgroundColor: paleta.fondo }]}>
          <Icon name={icon} size={18} color={paleta.texto} />
        </View>
      ) : null}
      <Text style={[estilos.etiqueta, { color: c.textoSuave }]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[estilos.valor, { color: paleta.texto }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text style={[estilos.pista, { color: c.textoTenue }]} numberOfLines={3}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg, minWidth: 0 },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  circulo: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  etiqueta: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.medium },
  conIcono: { marginLeft: SPACING.sm },
  valor: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.xs },
  valorGrande: { fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.sm },
  pista: { fontSize: FONT_SIZE.footnote, marginTop: SPACING.xs, lineHeight: 16 },
});
