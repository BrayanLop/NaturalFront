import { citasConfigurado, MENSAJE_CITAS_NO_CONFIGURADO } from '@/app/api/citasConfig';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/theme';
import { CitasAuthProvider, useCitasAuth } from '@/context/citasAuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Zona de CLIENTES externos (/citas/...). Vive fuera de (tabs) para no depender de la sesión de
 * Natural; su sesión la maneja `CitasAuthProvider`. El personal usa /agenda dentro de (tabs).
 */
export default function CitasClienteLayout() {
  const router = useRouter();

  if (!citasConfigurado) {
    return (
      <View style={styles.flex}>
        <EmptyState
          icon="🗓️"
          message="Agenda no disponible"
          subtitle={MENSAJE_CITAS_NO_CONFIGURADO}
          actionLabel="Volver"
          onAction={() => router.replace('/login')}
        />
      </View>
    );
  }

  return (
    <CitasAuthProvider>
      <PilaCliente />
    </CitasAuthProvider>
  );
}

const PANTALLAS_PUBLICAS = ['login', 'registro'];

function PilaCliente() {
  const { session, cargando, logout } = useCitasAuth();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const actual = String(segments[segments.length - 1] ?? '');

  // Sin sesión -> login; con login pero sin empresa -> empresas; con empresa -> fuera de login/registro.
  useEffect(() => {
    if (cargando) return;
    if (!session) {
      if (!PANTALLAS_PUBLICAS.includes(actual)) router.replace('/citas/login');
    } else if (!session.tenant) {
      if (actual !== 'empresas') router.replace('/citas/empresas');
    } else if (PANTALLAS_PUBLICAS.includes(actual) || actual === 'empresas') {
      router.replace('/citas');
    }
  }, [cargando, session, actual]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando) return <LoadingView message="Cargando..." fullScreen />;

  return (
    <Stack
      screenOptions={{
        contentStyle: { paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom, backgroundColor: COLORS.background },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.headline },
        headerShadowVisible: false,
        headerRight: () =>
          session ? (
            <Pressable onPress={logout} style={styles.salir} accessibilityLabel="Cerrar sesión">
              <FontAwesome5 name="sign-out-alt" size={16} color={COLORS.white} />
              <Text style={styles.salirTexto}>Salir</Text>
            </Pressable>
          ) : null,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="registro" options={{ title: 'Crear cuenta', headerRight: () => null }} />
      <Stack.Screen name="empresas" options={{ title: 'Elige dónde agendar', headerLeft: () => null }} />
      <Stack.Screen name="index" options={{ title: session?.empresaNombre || 'Mis citas', headerLeft: () => null }} />
      <Stack.Screen name="agendar" options={{ title: 'Agendar cita' }} />
      <Stack.Screen name="reprogramar" options={{ title: 'Reprogramar cita' }} />
      <Stack.Screen name="catalogo" options={{ title: 'Servicios y personal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  salir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginRight: SPACING.md },
  salirTexto: { color: COLORS.white, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.body },
});
