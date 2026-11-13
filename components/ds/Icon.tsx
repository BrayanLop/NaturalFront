import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  /** Color explícito. Si se omite, usa el color de texto del tema. */
  color?: string;
}

/** Único punto de acceso a iconos (Ionicons). No se usan emojis como iconos. */
export function Icon({ name, size = 20, color }: IconProps) {
  const { tema } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? tema.colores.texto} />;
}
