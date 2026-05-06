import BackButton from '@/components/BackButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Layout() {
  const { usuario, cargando, logout } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    }
  }, [cargando, usuario]);

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: {
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: FONT_WEIGHT.bold,
            fontSize: FONT_SIZE.headline,
          },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
          headerRight: () => (
            <Pressable
              onPress={() => setMenuVisible(true)}
              style={styles.headerRightButton}
            >
              <View style={styles.avatarCircle}>
                <FontAwesome5 name="user" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.headerUserName} numberOfLines={1}>
                {usuario?.nombre?.split(' ')[0] || 'Usuario'}
              </Text>
          </Pressable>
        ),
      }}
    >
      {/* Personalizamos los títulos */}
      <Stack.Screen 
        name="home" 
        options={{ 
          title: 'Natural', 
          headerLeft: () => (
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {usuario?.nombreEmpresa || 'Empresa'}
              </Text>
            </View>
          )
        }} 
      />
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
      <Stack.Screen name="contabilidad/index" options={{ title: 'Pagos' }} />
      <Stack.Screen name="contabilidad/historico" options={{ title: 'Histórico pagos' }} />
      <Stack.Screen name="contabilidad/detalleServicioPersona/[id]" options={{ title: 'Detalle pago' }} />
      <Stack.Screen name="cambiarContrasena" options={{ title: 'Cambiar contraseña' }} />
      <Stack.Screen name="ingresos/index" options={{ title: 'Ingresos' }} />
      <Stack.Screen name="egresos/index" options={{ title: 'Egresos' }} />
      <Stack.Screen name="egresos/crear" options={{ title: 'Registrar egreso' }} />
      <Stack.Screen name="consolidadoIngresos" options={{ title: 'Consolidado' }} />
      <Stack.Screen name="consolidadoFormaPago" options={{ title: 'Total por formas de pago' }} />
    </Stack>

    {/* Menú desplegable del usuario */}
    <Modal
      visible={menuVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={() => setMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <View style={styles.menuAvatarLarge}>
              <FontAwesome5 name="user" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.menuHeaderText}>
              <Text style={styles.menuUserName}>{usuario?.nombre || 'Usuario'}</Text>
              <Text style={styles.menuRolText}>
                {usuario?.rol === '01' ? 'Administrador' : usuario?.rol === '02' ? 'Trabajador' : 'Usuario'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/(tabs)/cambiarContrasena');
            }}
          >
            <View style={styles.menuItemIcon}>
              <FontAwesome5 name="key" size={14} color={COLORS.secondary} />
            </View>
            <Text style={styles.menuItemText}>Cambiar contraseña</Text>
            <FontAwesome5 name="chevron-right" size={12} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

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
  menuHeaderText: {
    flex: 1,
  },
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
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.lg,
  },
});

