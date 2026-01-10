import BackButton from '@/components/BackButton';
import { useAuth } from '@/context/authContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Layout() {
  const { usuario, cargando, logout } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

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
    <>
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
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, gap: 8 }}
            >
              <FontAwesome5 name="user-circle" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {usuario?.nombre || 'Usuario'}
              </Text>
          </TouchableOpacity>
        ),
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
      <Stack.Screen name="contabilidad/index" options={{ title: 'Pagos' }} />
      <Stack.Screen name="contabilidad/historico" options={{ title: 'Histórico pagos' }} />
      <Stack.Screen name="contabilidad/detalleServicioPersona/[id]" options={{ title: 'Detalle pago' }} />
      <Stack.Screen name="cambiarContrasena" options={{ title: 'Cambiar contraseña' }} />
      <Stack.Screen name="ingresos/index" options={{ title: 'Ingresos' }} />
      <Stack.Screen name="egresos/index" options={{ title: 'Egresos' }} />
      <Stack.Screen name="egresos/crear" options={{ title: 'Registrar egreso' }} />
    </Stack>

    {/* Menú desplegable del usuario */}
    <Modal
      visible={menuVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={() => setMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <FontAwesome5 name="user-circle" size={24} color="#2d3436" />
            <Text style={styles.menuUserName}>{usuario?.nombre || 'Usuario'}</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/(tabs)/cambiarContrasena');
            }}
          >
            <FontAwesome5 name="key" size={16} color="#0984e3" />
            <Text style={styles.menuItemText}>Cambiar contraseña</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              logout();
            }}
          >
            <FontAwesome5 name="sign-out-alt" size={16} color="#d63031" />
            <Text style={[styles.menuItemText, { color: '#d63031' }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 12,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  menuUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#2d3436',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 8,
  },
});

