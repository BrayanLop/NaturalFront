import { Badge, type TonoBadge } from '@/components/ds';
import React from 'react';

/**
 * Compatibilidad: conserva la API anterior (`label` + `type`) pero dibuja el estado sutil del
 * sistema de diseño (fondo tenue + punto), no el bloque de color sólido.
 * Al migrar cada pantalla se reemplaza por `<Badge tone=... />` de `@/components/ds`.
 */
interface StatusBadgeProps {
  label: string;
  type: 'confirmado' | 'liquidado' | 'disponible' | 'info' | 'pendiente' | 'aprobado' | 'rechazado';
}

const TONO: Record<StatusBadgeProps['type'], TonoBadge> = {
  confirmado: 'success',
  aprobado: 'success',
  disponible: 'success',
  liquidado: 'info',
  pendiente: 'warning',
  rechazado: 'error',
  info: 'neutral',
};

const StatusBadge = React.memo(function StatusBadge({ label, type }: StatusBadgeProps) {
  return <Badge label={label} tone={TONO[type]} />;
});

export default StatusBadge;
