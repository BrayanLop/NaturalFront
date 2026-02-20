import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingViewProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

const LoadingView = React.memo(function LoadingView({ 
  size = 'large', 
  color = COLORS.primary,
  message,
  fullScreen = true,
}: LoadingViewProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
});

export default LoadingView;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  message: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});
