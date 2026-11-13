import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useTheme } from '@/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Color del icono y su fondo suave. Por defecto, el verde de marca. */
  iconColor?: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
}

/** Fila de lista: icono en cuadro suave, título, subtítulo, estado y flecha. */
export function ListRow({ title, subtitle, icon, iconColor, badge, trailing, chevron, onPress }: ListRowProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const colorIcono = iconColor ?? c.primarioTexto;

  const contenido = (
    <>
      {icon ? (
        <View style={[estilos.icono, { backgroundColor: iconColor ? c.fondoSuave : c.primarioSuave }]}>
          <Icon name={icon} size={20} color={colorIcono} />
        </View>
      ) : null}
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: c.texto }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[estilos.subtitulo, { color: c.textoSuave }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {badge ? <View style={estilos.badge}>{badge}</View> : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevron-forward" size={18} color={c.textoTenue} /> : null}
    </>
  );

  const base = [
    estilos.fila,
    { backgroundColor: c.superficie, borderColor: c.borde },
    sombra(tema, 'sm'),
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        style={({ pressed }) => [...base, { opacity: pressed ? 0.9 : 1 }]}
      >
        {contenido}
      </Pressable>
    );
  }
  return <View style={base}>{contenido}</View>;
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  icono: { width: 40, height: 40, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  textos: { flex: 1, minWidth: 0 },
  titulo: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold },
  subtitulo: { fontSize: FONT_SIZE.subhead, marginTop: 2 },
  badge: { marginTop: SPACING.xs + 2 },
});
