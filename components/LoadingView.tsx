import { COLORS } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoadingViewProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingView({ size = 'large', color = COLORS.primary }: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
