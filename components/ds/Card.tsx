import { RADIUS, SPACING, sombra, useTheme } from '@/theme';
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type VarianteCard = 'default' | 'tinted' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: VarianteCard;
  onPress?: () => void;
  padding?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta base. `default` = superficie con sombra fina; `tinted` = fondo suave de marca; `outlined` = solo borde. */
export function Card({ children, variant = 'default', onPress, padding = SPACING.lg, accessibilityLabel, style }: CardProps) {
  const { tema } = useTheme();
  const c = tema.colores;

  const base: ViewStyle = {
    borderRadius: RADIUS.xl,
    padding,
    backgroundColor: variant === 'tinted' ? c.primarioSuave : c.superficie,
    borderWidth: 1,
    borderColor: variant === 'tinted' ? c.primarioBorde : c.borde,
    ...(variant === 'default' ? sombra(tema, 'sm') : null),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [base, estilos.espacio, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, estilos.espacio, style]}>{children}</View>;
}

/** Línea divisoria fina. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { tema } = useTheme();
  return <View style={[{ height: 1, backgroundColor: tema.colores.divisor }, style]} />;
}

const estilos = StyleSheet.create({
  espacio: { marginBottom: SPACING.md },
});
