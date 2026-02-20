import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon,
  fullWidth = true,
}: PrimaryButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Variante de color
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'danger':
        baseStyle.push(styles.buttonDanger);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
      default:
        baseStyle.push(styles.buttonPrimary);
    }
    
    // Tamaño
    if (size === 'small') baseStyle.push(styles.buttonSmall);
    if (size === 'large') baseStyle.push(styles.buttonLarge);
    
    // Ancho
    if (!fullWidth) baseStyle.push(styles.buttonAuto);
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (variant === 'outline') baseStyle.push(styles.buttonTextOutline);
    if (variant === 'ghost') baseStyle.push(styles.buttonTextGhost);
    if (size === 'small') baseStyle.push(styles.buttonTextSmall);
    if (disabled) baseStyle.push(styles.buttonTextDisabled);
    
    return baseStyle;
  };

  const getLoaderColor = () => {
    if (variant === 'outline' || variant === 'ghost') return COLORS.primary;
    return COLORS.white;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        ...getButtonStyle(),
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  buttonDanger: {
    backgroundColor: COLORS.error,
    ...SHADOWS.sm,
  },
  buttonOutline: {
    backgroundColor: COLORS.transparent,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonGhost: {
    backgroundColor: COLORS.primarySurface,
  },
  buttonSmall: {
    height: 40,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
  },
  buttonLarge: {
    height: 56,
    paddingHorizontal: SPACING.xxl,
  },
  buttonAuto: {
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
    ...SHADOWS.none,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    marginRight: SPACING.xs,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.headline,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.3,
  },
  buttonTextOutline: {
    color: COLORS.primary,
  },
  buttonTextGhost: {
    color: COLORS.primary,
  },
  buttonTextSmall: {
    fontSize: FONT_SIZE.body,
  },
  buttonTextDisabled: {
    color: COLORS.disabledText,
  },
});
