import { AppText, IconButton } from '@/components/ds';
import { SPACING } from '@/theme';
import { StyleSheet, View } from 'react-native';

interface EncabezadoPasoProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

/** Título de cada paso del registro (persona → servicios → resumen) con botón de volver. */
export function EncabezadoPaso({ title, subtitle, onBack }: EncabezadoPasoProps) {
  return (
    <View style={estilos.fila}>
      <IconButton icon="chevron-back" variant="soft" accessibilityLabel="Volver" onPress={onBack} />
      <View style={estilos.textos}>
        <AppText variante="subtitulo" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variante="nota" tono="suave">
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  textos: { flex: 1, minWidth: 0 },
});
