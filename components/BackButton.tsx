import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
}

export default function BackButton({ onPress, color = '#fff' }: BackButtonProps) {
  const navigation: any = useNavigation();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    try {
      if (navigation?.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
    } catch (e) {
      // ignore
    }

    // Fallback: si no hay historial, reemplazar a la pantalla de inicio
    router.replace('/(tabs)/home');
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={[styles.button, color !== '#fff' && styles.buttonDark]} 
      accessibilityLabel="Volver"
    >
      <Ionicons name="chevron-back" size={24} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
  buttonDark: {
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
