import { Icon, type IconName } from '@/components/ds';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme, type Preferencia } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const OPCIONES: { key: Preferencia; label: string; icon: IconName }[] = [
  { key: 'sistema', label: 'Sistema', icon: 'phone-portrait-outline' },
  { key: 'claro', label: 'Claro', icon: 'sunny-outline' },
  { key: 'oscuro', label: 'Oscuro', icon: 'moon-outline' },
];

/**
 * Selector de apariencia (Sistema / Claro / Oscuro) para el menú del usuario.
 * Lo ven todos los roles. La elección se guarda en el dispositivo y no se borra al cerrar sesión.
 */
export default function SelectorApariencia() {
  const { tema, preferencia, setPreferencia } = useTheme();
  const c = tema.colores;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.titulo}>
        <Icon name="contrast-outline" size={20} color={c.primarioTexto} />
        <Text style={[estilos.tituloTexto, { color: c.texto }]}>Apariencia</Text>
      </View>
      <View
        style={[estilos.segmentos, { backgroundColor: c.fondoSuave }]}
        accessibilityRole="radiogroup"
      >
        {OPCIONES.map((o) => {
          const activo = preferencia === o.key;
          const colorTexto = activo ? c.sobrePrimario : c.textoSuave;
          return (
            <Pressable
              key={o.key}
              onPress={() => setPreferencia(o.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`Apariencia ${o.label}`}
              style={[estilos.segmento, activo && { backgroundColor: c.primarioFuerte }]}
            >
              <Icon name={o.icon} size={16} color={colorTexto} />
              <Text
                style={[
                  estilos.segmentoTexto,
                  { color: colorTexto, fontWeight: activo ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium },
                ]}
                numberOfLines={1}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  tituloTexto: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.medium },
  segmentos: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: 3, gap: 2 },
  segmento: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  segmentoTexto: { fontSize: FONT_SIZE.footnote },
});
