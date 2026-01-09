import { commonStyles } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

const EmptyState = React.memo(function EmptyState({ message, icon = '📭' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={commonStyles.emptyText}>{message}</Text>
    </View>
  );
});

export default EmptyState;

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
