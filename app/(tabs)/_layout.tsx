import BackButton from '@/components/BackButton';
import { useAuth } from '@/context/authContext';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Layout() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    }
  }, [cargando, usuario]);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00b894" />
      </View>
    );
  }

  if (!usuario) {
    return null; // Se redirige al login
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#00b894',
        },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => <BackButton />,
      }}
    >
      {/* Personalizamos los títulos */}
      <Stack.Screen name="home" options={{ title: 'Natural', headerLeft: () => null }} />
      <Stack.Screen name="personas/index" options={{ title: 'Personas' }} />
      <Stack.Screen name="personas/crear" options={{ title: 'Crear persona' }} />
      <Stack.Screen name="personas/[id]" options={{ title: 'Editar persona' }} />
      <Stack.Screen name="servicios/index" options={{ title: 'Servicios' }} />
      <Stack.Screen name="servicios/crear" options={{ title: 'Crear servicio' }} />
      <Stack.Screen name="servicios/[id]" options={{ title: 'Editar servicio' }} />
      <Stack.Screen name="configuracion" options={{ title: 'Configuración general' }} />
      <Stack.Screen name="registroServicio" options={{ title: 'Registro servicio' }} />
      <Stack.Screen name="registroServicio/index" options={{ title: 'Registro servicio' }} />
      <Stack.Screen name="registroServicio/personas" options={{ title: 'Personas' }} />
      <Stack.Screen name="registroServicio/servicios" options={{ title: 'Servicios' }} />
      <Stack.Screen name="configuracion/index" options={{ title: 'Configuración general' }} />
      <Stack.Screen name="configuracionServicio/index" options={{ title: 'Configuración servicios' }} />
      <Stack.Screen name="configuracionServicio/crear" options={{ title: 'Crear configuración' }} />
      <Stack.Screen name="configuracionServicio/[id]" options={{ title: 'Editar configuración' }} />
      <Stack.Screen name="contabilidad/index" options={{ title: 'Liquidación' }} />
      <Stack.Screen name="contabilidad/historico" options={{ title: 'Histórico liquidaciones' }} />
      <Stack.Screen name="contabilidad/detalleServicioPersona/[id]" options={{ title: 'Detalle liquidación' }} />
      <Stack.Screen name="ingresos/index" options={{ title: 'Ingresos' }} />
    </Stack>
  );
}
