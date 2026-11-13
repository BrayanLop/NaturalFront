import { FONT_SIZE, FONT_WEIGHT, SPACING, useTheme } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';
import type { IconName } from './Icon';
import { IconButton } from './IconButton';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Acción principal de la pantalla (por ejemplo, "+" para crear). */
  action?: { icon: IconName; onPress: () => void; label: string };
}

/** Cabecera de página dentro del contenido: título, resumen y acción principal. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <View style={[estilos.fila, { borderBottomColor: c.divisor }]}>
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: c.texto }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={[estilos.subtitulo, { color: c.textoSuave }]}>{subtitle}</Text> : null}
      </View>
      {action ? <IconButton icon={action.icon} onPress={action.onPress} accessibilityLabel={action.label} variant="solid" /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  textos: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  titulo: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold },
  subtitulo: { fontSize: FONT_SIZE.subhead, marginTop: 2 },
});
