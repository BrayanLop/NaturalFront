// app/(tabs)/registroServicio/_layout.tsx
import { Stack } from 'expo-router';

export default function RegistroServicioLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 👈 Oculta el header completamente
      }}
    />
  );
}
