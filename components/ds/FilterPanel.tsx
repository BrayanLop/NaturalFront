import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, useTheme } from '@/theme';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { Card } from './Card';
import { Icon } from './Icon';

interface FilterPanelProps {
  title?: string;
  /** Cantidad de filtros distintos del valor por defecto; se muestra como "N activos". */
  activeCount?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Panel de filtros plegable. Con muchos filtros (persona, estado, forma de pago…) la lista no
 * ocupa media pantalla: queda cerrado y avisa cuántos filtros hay activos.
 */
export function FilterPanel({ title = 'Filtros', activeCount = 0, defaultOpen = true, children }: FilterPanelProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const [abierto, setAbierto] = useState(defaultOpen);

  return (
    <Card padding={0} style={estilos.card}>
      <Pressable
        onPress={() => setAbierto((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={`${title}${activeCount > 0 ? `, ${activeCount} activos` : ''}`}
        style={estilos.cabecera}
      >
        <Icon name="options-outline" size={18} color={c.primarioTexto} />
        <Text style={[estilos.titulo, { color: c.texto }]}>{title}</Text>
        {activeCount > 0 ? <Badge label={`${activeCount} activo${activeCount === 1 ? '' : 's'}`} tone="primary" dot={false} size="sm" /> : null}
        <View style={estilos.flecha}>
          <Icon name={abierto ? 'chevron-up' : 'chevron-down'} size={18} color={c.textoTenue} />
        </View>
      </Pressable>
      {abierto ? <View style={[estilos.cuerpo, { borderTopColor: c.divisor }]}>{children}</View> : null}
    </Card>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onPress: () => void;
}

/** Campo de fecha tocable. Dos por fila (Desde / Hasta) sin anchos fijos. */
export function DateField({ label, value, onPress }: DateFieldProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        estilos.fecha,
        { backgroundColor: c.superficie, borderColor: c.borde, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={estilos.fechaTextos}>
        <Text style={[estilos.fechaEtiqueta, { color: c.textoSuave }]}>{label}</Text>
        <Text style={[estilos.fechaValor, { color: c.texto }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
      <Icon name="calendar-outline" size={18} color={c.primarioTexto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  card: { overflow: 'hidden' },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, minHeight: 52, gap: SPACING.sm },
  titulo: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold },
  flecha: { marginLeft: 'auto' },
  cuerpo: { padding: SPACING.lg, borderTopWidth: 1 },
  fecha: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 56,
  },
  fechaTextos: { flex: 1, minWidth: 0, marginRight: SPACING.sm },
  fechaEtiqueta: { fontSize: FONT_SIZE.footnote },
  fechaValor: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold, marginTop: 1 },
});
