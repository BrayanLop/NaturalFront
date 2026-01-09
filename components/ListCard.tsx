import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ListCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  badges?: React.ReactNode;
  onPress?: () => void;
  rightContent?: React.ReactNode;
}

export default function ListCard({
  title,
  subtitle,
  description,
  badges,
  onPress,
  rightContent,
}: ListCardProps) {
  const Content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {badges}
        </View>
        {rightContent}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
