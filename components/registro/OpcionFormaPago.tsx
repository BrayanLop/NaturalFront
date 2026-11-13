import { AppText, Icon, type IconName } from '@/components/ds';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { Pressable, View } from 'react-native';

interface OpcionFormaPagoProps {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}

/**
 * Tarjeta elegible de forma de pago. Seleccionada: borde verde grueso, fondo suave y check;
 * sin seleccionar: borde de control y círculo vacío (se entiende que es tocable).
 */
export function OpcionFormaPago({ label, icon, selected, onPress }: OpcionFormaPagoProps) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [estilos.opcion, selected ? estilos.opcionElegida : null, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={estilos.check}>
        <Icon
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={selected ? c.primarioFuerte : c.bordeFuerte}
        />
      </View>
      <View style={[estilos.icono, selected ? estilos.iconoElegido : null]}>
        <Icon name={icon} size={24} color={selected ? c.sobrePrimario : c.primarioTexto} />
      </View>
      <AppText style={[estilos.texto, selected ? estilos.textoElegido : null]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const crearEstilos = (t: Tema) => ({
  opcion: {
    flex: 1,
    minWidth: 0,
    minHeight: 112,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: t.colores.bordeFuerte,
    backgroundColor: t.colores.superficie,
  },
  opcionElegida: { borderWidth: 2, borderColor: t.colores.primarioFuerte, backgroundColor: t.colores.primarioSuave },
  check: { position: 'absolute' as const, top: SPACING.sm, right: SPACING.sm },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.colores.primarioSuave,
  },
  iconoElegido: { backgroundColor: t.colores.primarioFuerte },
  texto: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  textoElegido: { color: t.colores.primarioTexto },
});
