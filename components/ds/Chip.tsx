import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
}

/** Ficha seleccionable. Seleccionada = verde sólido; sin seleccionar = borde suave. */
export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const colorTexto = selected ? c.sobrePrimario : c.texto;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        estilos.chip,
        {
          backgroundColor: selected ? c.primarioFuerte : c.superficie,
          borderColor: selected ? c.primarioFuerte : c.borde,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon ? (
        <View style={estilos.icono}>
          <Icon name={icon} size={15} color={colorTexto} />
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        style={[estilos.texto, { color: colorTexto, fontWeight: selected ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export interface OpcionChip {
  key: string;
  label: string;
  icon?: IconName;
}

interface ChipGroupProps {
  label?: string;
  options: OpcionChip[];
  value: string;
  onChange: (key: string) => void;
  /**
   * `false` (por defecto): las fichas pasan a la línea siguiente cuando no caben.
   * `true`: una sola fila con desplazamiento horizontal (útil con muchas opciones).
   */
  scroll?: boolean;
}

/**
 * Grupo de fichas de selección única. Siempre ocupa el ancho disponible (nunca fuerza un ancho fijo),
 * por eso no se sale del borde en pantallas angostas.
 */
export function ChipGroup({ label, options, value, onChange, scroll = false }: ChipGroupProps) {
  const { tema } = useTheme();
  const c = tema.colores;

  const fichas = options.map((o) => (
    <Chip key={o.key} label={o.label} icon={o.icon} selected={value === o.key} onPress={() => onChange(o.key)} />
  ));

  return (
    <View style={estilos.grupo}>
      {label ? <Text style={[estilos.etiqueta, { color: c.textoSuave }]}>{label}</Text> : null}
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
          {fichas}
        </ScrollView>
      ) : (
        <View style={[estilos.fila, estilos.envuelve]}>{fichas}</View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  chip: {
    minHeight: 36,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  icono: { marginRight: SPACING.xs + 2 },
  texto: { fontSize: FONT_SIZE.subhead },
  grupo: { alignSelf: 'stretch', minWidth: 0, marginBottom: SPACING.md },
  etiqueta: {
    fontSize: FONT_SIZE.footnote,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  envuelve: { flexWrap: 'wrap' },
});
