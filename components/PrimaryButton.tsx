import { Button, type TamanoBoton, type VarianteBoton } from '@/components/ds';
import React from 'react';

/**
 * Compatibilidad: conserva la API anterior pero dibuja el `Button` del sistema de diseño.
 * Al migrar cada pantalla se reemplaza por `<Button />` de `@/components/ds`.
 *
 * `danger` = contorno rojo (el rojo se reserva para eliminar). `outline` equivale a `secondary`.
 */
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

const VARIANTE: Record<NonNullable<PrimaryButtonProps['variant']>, VarianteBoton> = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
};

const TAMANO: Record<NonNullable<PrimaryButtonProps['size']>, TamanoBoton> = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
};

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
  return (
    <Button
      title={title}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant={VARIANTE[variant]}
      size={TAMANO[size]}
      icon={icon}
      fullWidth={fullWidth}
    />
  );
}
