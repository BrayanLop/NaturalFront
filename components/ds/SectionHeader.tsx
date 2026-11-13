import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';

interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  /** Explicación corta. Se muestra al tocar el icono ⓘ, en vez de un párrafo fijo. */
  ayuda?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Encabezado de sección: título corto, icono opcional y ayuda plegable. */
export function SectionHeader({ title, icon, ayuda, right, style }: SectionHeaderProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const [verAyuda, setVerAyuda] = useState(false);

  return (
    <View style={[estilos.contenedor, style]}>
      <View style={estilos.fila}>
        {icon ? (
          <View style={[estilos.icono, { backgroundColor: c.primarioSuave }]}>
            <Icon name={icon} size={16} color={c.primarioTexto} />
          </View>
        ) : null}
        <Text style={[estilos.titulo, { color: c.texto }]} numberOfLines={2}>
          {title}
        </Text>
        {ayuda ? (
          <Pressable
            onPress={() => setVerAyuda((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={verAyuda ? 'Ocultar explicación' : 'Ver explicación'}
            style={estilos.info}
          >
            <Icon name={verAyuda ? 'information-circle' : 'information-circle-outline'} size={20} color={c.textoTenue} />
          </Pressable>
        ) : null}
        {right ? <View style={estilos.derecha}>{right}</View> : null}
      </View>
      {ayuda && verAyuda ? (
        <Text style={[estilos.ayuda, { color: c.textoSuave, backgroundColor: c.fondoSuave }]}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginTop: SPACING.sm, marginBottom: SPACING.md },
  fila: { flexDirection: 'row', alignItems: 'center' },
  icono: { width: 28, height: 28, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  titulo: { flexShrink: 1, fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.bold },
  info: { marginLeft: SPACING.xs },
  derecha: { marginLeft: 'auto', paddingLeft: SPACING.sm },
  ayuda: {
    fontSize: FONT_SIZE.footnote,
    lineHeight: 17,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
});
