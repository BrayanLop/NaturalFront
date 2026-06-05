import { commonStyles } from '@/constants/theme';
import React from 'react';
import { Text, View } from 'react-native';

interface StatusBadgeProps {
  label: string;
  type:
    | 'confirmado'
    | 'liquidado'
    | 'disponible'
    | 'info'
    | 'pendiente'
    | 'aprobado'
    | 'rechazado';
}

const BADGE_COLORS = {
  confirmado: '#00b894',
  aprobado: '#00b894',
  liquidado: '#0984e3',
  disponible: '#1e8449', // Verde más oscuro y fuerte
  pendiente: '#f39c12', // Ámbar
  rechazado: '#e74c3c', // Rojo
  info: '#636e72',
};

const StatusBadge = React.memo(function StatusBadge({ label, type }: StatusBadgeProps) {
  return (
    <View style={[commonStyles.badge, { backgroundColor: BADGE_COLORS[type] }]}>
      <Text style={commonStyles.badgeText}>{label}</Text>
    </View>
  );
});

export default StatusBadge;
