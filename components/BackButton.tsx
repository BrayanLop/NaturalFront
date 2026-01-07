import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function BackButton() {
  const navigation: any = useNavigation();
  const router = useRouter();

  const handlePress = () => {
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
    <TouchableOpacity onPress={handlePress} style={styles.button} accessibilityLabel="Volver">
      <Ionicons name="chevron-back" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 12,
    padding: 6,
  },
});
