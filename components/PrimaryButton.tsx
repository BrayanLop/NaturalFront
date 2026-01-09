import { COLORS, commonStyles } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'blue';
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return commonStyles.buttonSecondary;
      case 'danger':
        return commonStyles.buttonDanger;
      case 'outline':
        return commonStyles.buttonOutline;
      case 'blue':
        return { ...commonStyles.button, backgroundColor: '#0984e3' };
      default:
        return commonStyles.button;
    }
  };

  const getTextStyle = () => {
    return variant === 'outline'
      ? commonStyles.buttonTextOutline
      : commonStyles.buttonText;
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        (disabled || loading) && commonStyles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.secondary : COLORS.white} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
