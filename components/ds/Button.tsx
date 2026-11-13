import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, sombra, useTheme } from '@/theme';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';

/**
 * Variantes:
 *  - primary:     acción principal (verde de marca).
 *  - secondary:   acción secundaria (contorno verde).
 *  - ghost:       acción terciaria (solo texto).
 *  - danger:      eliminar (contorno rojo). El rojo se reserva para acciones destructivas.
 *  - dangerSolid: confirmación destructiva final (rojo sólido).
 */
export type VarianteBoton = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSolid';
export type TamanoBoton = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: VarianteBoton;
  size?: TamanoBoton;
  /** Nombre de Ionicons, o un nodo propio. */
  icon?: IconName | React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ALTURAS: Record<TamanoBoton, number> = { sm: 40, md: 48, lg: 54 };
const TEXTO: Record<TamanoBoton, number> = { sm: FONT_SIZE.subhead, md: FONT_SIZE.callout, lg: FONT_SIZE.headline };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps) {
  const { tema } = useTheme();
  const c = tema.colores;
  const inactivo = disabled || loading;

  const relleno = variant === 'primary' || variant === 'dangerSolid';
  let fondo = 'transparent';
  let texto = c.primarioTexto;
  let borde = 'transparent';

  switch (variant) {
    case 'primary':
      fondo = c.primarioFuerte;
      texto = c.sobrePrimario;
      break;
    case 'secondary':
      borde = c.primarioFuerte;
      texto = c.primarioTexto;
      break;
    case 'ghost':
      texto = c.primarioTexto;
      break;
    case 'danger':
      borde = c.error;
      texto = c.errorTexto;
      break;
    case 'dangerSolid':
      fondo = c.error;
      texto = c.blanco;
      break;
  }

  if (disabled) {
    fondo = relleno ? c.deshabilitado : 'transparent';
    texto = c.textoDeshabilitado;
    borde = relleno || variant === 'ghost' ? 'transparent' : c.borde;
  }

  const contenidoIcono =
    typeof icon === 'string' ? <Icon name={icon as IconName} size={size === 'sm' ? 16 : 18} color={texto} /> : icon;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactivo, busy: loading }}
      hitSlop={size === 'sm' ? { top: 2, bottom: 2 } : undefined}
      testID={testID}
      style={({ pressed }) => [
        estilos.base,
        {
          minHeight: ALTURAS[size],
          backgroundColor: fondo,
          borderColor: borde,
          borderWidth: borde === 'transparent' ? 0 : 1.5,
          opacity: pressed && !inactivo ? 0.85 : 1,
        },
        relleno && !disabled ? sombra(tema, 'sm') : null,
        fullWidth ? estilos.completo : estilos.auto,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={texto} />
      ) : (
        <View style={estilos.contenido}>
          {contenidoIcono ? <View style={estilos.icono}>{contenidoIcono}</View> : null}
          <Text style={[estilos.texto, { color: texto, fontSize: TEXTO[size] }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completo: { alignSelf: 'stretch' },
  auto: { alignSelf: 'flex-start' },
  contenido: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icono: { marginRight: SPACING.sm },
  texto: { fontWeight: FONT_WEIGHT.semibold, textAlign: 'center', letterSpacing: 0.2 },
});
