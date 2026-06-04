import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CitasLayout() {
  const { session, cargando, logout } = useCitasAuth();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  // El último segmento nos dice si estamos en la pantalla de login del módulo.
  const enLogin = segments[segments.length - 1] === 'login';

  useEffect(() => {
    if (!cargando && !session && !enLogin) {
      router.replace('/citas/login');
    }
  }, [cargando, session, enLogin]);

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { paddingLeft: insets.left, paddingRight: insets.right },
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.headline },
          headerShadowVisible: false,
          headerRight: () =>
            session ? (
              <Pressable onPress={() => setMenuVisible(true)} style={styles.headerRightButton}>
                <View style={styles.avatarCircle}>
                  <FontAwesome5 name="user" size={14} color={COLORS.primary} />
                </View>
                <Text style={styles.headerUserName} numberOfLines={1}>
                  {session.usuario?.split(' ')[0] || 'Usuario'}
                </Text>
              </Pressable>
            ) : null,
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="home"
          options={{
            title: 'Citas',
            headerLeft: () => (
              <View style={{ marginLeft: SPACING.md }}>
                <Text style={styles.headerEmpresa}>{session?.empresaNombre || 'Empresa'}</Text>
              </View>
            ),
          }}
        />
        <Stack.Screen name="servicios/index" options={{ title: 'Servicios' }} />
        <Stack.Screen name="servicios/crear" options={{ title: 'Nuevo servicio' }} />
        <Stack.Screen name="servicios/[id]" options={{ title: 'Editar servicio' }} />
        <Stack.Screen name="agenda/index" options={{ title: 'Citas' }} />
        <Stack.Screen name="agenda/crear" options={{ title: 'Agendar cita' }} />
        <Stack.Screen name="agenda/[id]" options={{ title: 'Detalle de la cita' }} />
        <Stack.Screen name="usuarios/index" options={{ title: 'Clientes y empleados' }} />
      </Stack>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatarLarge}>
                <FontAwesome5 name="user" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuUserName}>{session?.usuario || 'Usuario'}</Text>
                <Text style={styles.menuRolText}>
                  {session?.mode === 'empresa' ? 'Empresa (administrador)' : 'Cliente'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                logout();
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: COLORS.errorLight }]}>
                <FontAwesome5 name="sign-out-alt" size={14} color={COLORS.error} />
              </View>
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>Cerrar sesión</Text>
              <FontAwesome5 name="chevron-right" size={12} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerRightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUserName: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
    maxWidth: 100,
  },
  headerEmpresa: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: SPACING.md,
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    minWidth: 260,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  menuAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  menuHeaderText: { flex: 1 },
  menuUserName: {
    fontSize: FONT_SIZE.headline,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  menuRolText: {
    fontSize: FONT_SIZE.footnote,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    fontWeight: FONT_WEIGHT.medium,
  },
});
