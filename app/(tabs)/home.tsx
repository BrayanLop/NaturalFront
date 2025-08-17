import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/authContext';

export default function Home() {
  const { logout } = useAuth();
  const router = useRouter();
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    const fetchRol = async () => {
      const value = await AsyncStorage.getItem('rol');
      setRol(value);
    };
    fetchRol();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (rol === null) {
    return (
      <View style={styles.container}>
        <Text>Cargando menú...</Text>
      </View>
    );
  }

  const menuItems =
    rol === '2' //Empleado
      ? [
          { title: 'Registrar servicios', route: '../registroServicio' as const, icon: 'clipboard-check' },
        ]
      : [
          { title: 'Personas', route: '../personas' as const, icon: 'user-plus' },
          { title: 'Servicios', route: '../servicios' as const, icon: 'tools' },
          { title: 'Configuración general', route: '../configuracionServicio' as const, icon: 'cogs' },
          { title: 'Registrar servicios', route: '../registroServicio' as const, icon: 'clipboard-check' },
          { title: 'Liquidar', route: '../contabilidad' as const, icon: 'file-invoice-dollar' },
        ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuButton}
            onPress={() => router.push(item.route)}
          >
            <FontAwesome5 name={item.icon} size={30} color="white" />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  menuButton: {
    width: 140,
    height: 120,
    backgroundColor: '#00b894',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    elevation: 5,
  },
  menuText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#d63031',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
