import { commonStyles } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

export default function EmptyState({ message, icon = '📭' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={commonStyles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
});
