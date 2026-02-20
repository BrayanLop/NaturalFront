import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ListCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  badges?: React.ReactNode;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

const ListCard = React.memo(function ListCard({
  title,
  subtitle,
  description,
  badges,
  onPress,
  rightContent,
  leftIcon,
}: ListCardProps) {
  const Content = (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <View style={styles.textContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {badges}
            </View>
            {rightContent}
          </View>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          {description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        {Content}
      </Pressable>
    );
  }

  return <View style={styles.wrapper}>{Content}</View>;
});

export default ListCard;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  pressable: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.headline,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xxs,
  },
  subtitle: {
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    marginTop: SPACING.xxs,
  },
  description: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZE.body * 1.4,
  },
});
