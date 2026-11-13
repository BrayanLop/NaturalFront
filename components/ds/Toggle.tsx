import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import { StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from 'react-native';

interface ToggleProps {
  value: boolean;
  onValueChange: (valor: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Switch con los colores del tema (reemplaza el verde nativo de iOS y el gris suelto). */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: ToggleProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: c.bordeFuerte, true: c.primarioFuerte }}
      thumbColor={c.blanco}
      ios_backgroundColor={c.bordeFuerte}
    />
  );
}

interface ToggleRowProps extends ToggleProps {
  label: string;
  /** Texto que explica el estado actual (por ejemplo, "Visible" / "Oculto temporalmente"). */
  description?: string;
  style?: StyleProp<ViewStyle>;
}

/** Fila con etiqueta, descripción del estado y switch, dentro de una caja. */
export function ToggleRow({ label, description, style, ...toggle }: ToggleRowProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <View style={[estilos.fila, { backgroundColor: c.superficie, borderColor: c.borde }, style]}>
      <View style={estilos.textos}>
        <Text style={[estilos.label, { color: c.texto }]}>{label}</Text>
        {description ? <Text style={[estilos.descripcion, { color: c.textoSuave }]}>{description}</Text> : null}
      </View>
      <Toggle {...toggle} accessibilityLabel={toggle.accessibilityLabel ?? label} />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
    marginBottom: SPACING.lg,
  },
  textos: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  label: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold },
  descripcion: { fontSize: FONT_SIZE.footnote, marginTop: 2 },
});
