import { COLORS } from '@/constants/theme';

const ESTADO_COLOR: Record<string, string> = {
  Pendiente: COLORS.warning,
  Confirmada: COLORS.primary,
  Completada: COLORS.secondary,
  Cancelada: COLORS.error,
};

/** Color asociado a cada estado de una cita. */
export function estadoColor(estado: string): string {
  return ESTADO_COLOR[estado] ?? COLORS.textSecondary;
}
