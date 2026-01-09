import { commonStyles } from '@/constants/theme';
import React from 'react';
import { Text, View } from 'react-native';

interface StatusBadgeProps {
  label: string;
  type: 'confirmado' | 'liquidado' | 'disponible' | 'info';
}

const BADGE_COLORS = {
  confirmado: '#00b894',
  liquidado: '#0984e3',
  disponible: '#00b894',
  info: '#636e72',
};

export default function StatusBadge({ label, type }: StatusBadgeProps) {
  return (
    <View style={[commonStyles.badge, { backgroundColor: BADGE_COLORS[type] }]}>
      <Text style={commonStyles.badgeText}>{label}</Text>
    </View>
  );
}
