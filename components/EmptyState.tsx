import { EmptyState as EmptyStateDs } from '@/components/ds';
import React from 'react';
import { View } from 'react-native';

/**
 * Compatibilidad: conserva la API anterior pero dibuja el `EmptyState` del sistema de diseño.
 * `icon` (antes un emoji en texto) se ignora: se usa el icono de línea por defecto.
 * Al migrar cada pantalla se reemplaza por `<EmptyState title=... />` de `@/components/ds`.
 */
interface EmptyStateProps {
  message: string;
  icon?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = React.memo(function EmptyState({ message, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', minHeight: 300 }}>
      <EmptyStateDs title={message} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction} />
    </View>
  );
});

export default EmptyState;
