import { RADIUS, useTheme } from '@/theme';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';

type VarianteIconButton = 'soft' | 'solid' | 'ghost' | 'danger' | 'header';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  /** Obligatorio: describe la acción para lectores de pantalla. */
  accessibilityLabel: string;
  variant?: VarianteIconButton;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LADO = { sm: 36, md: 44 } as const;

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'soft',
  size = 'md',
  disabled = false,
  style,
}: IconButtonProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const lado = LADO[size];

  const paleta = {
    soft: { fondo: c.primarioSuave, icono: c.primarioTexto },
    solid: { fondo: c.primarioFuerte, icono: c.sobrePrimario },
    ghost: { fondo: 'transparent', icono: c.textoSuave },
    danger: { fondo: c.errorSuave, icono: c.errorTexto },
    header: { fondo: c.encabezadoControl, icono: c.sobreEncabezado },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={size === 'sm' ? 4 : undefined}
      style={({ pressed }) => [
        estilos.base,
        {
          width: lado,
          height: lado,
          backgroundColor: paleta.fondo,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={size === 'sm' ? 18 : 22} color={paleta.icono} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
});
