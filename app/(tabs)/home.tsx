import { puedeRegistrarServicios } from '@/utils/roles';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/authContext';

type MenuItem = {
  title: string;
  route: string;
  icon: string;
};

export default function Home() {
  const { usuario, logout, cargando } = useAuth();
  const router = useRouter();

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text>Cargando menú...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text>No hay usuario en sesión</Text>
      </View>
    );
  }

  const rol = usuario.rol; // ✅ directamente del context
  const personaId = usuario.id; // si necesitas el id

  // Usuarios con rol '02' (trabajador) o '03' (super empleado) ven menú limitado
  // Solo rol '01' (admin puro) ve el menú completo
  const menuItems: MenuItem[] =
    puedeRegistrarServicios(rol)
      ? [
          {
            title: 'Registrar servicios',
            route: '../registroServicio',
            icon: 'clipboard-check',
          },
          {
            title: 'Pagos',
            route: '../contabilidad',
            icon: 'file-invoice-dollar',
          },
          {
            title: 'Histórico pagos',
            route: '../contabilidad/historico',
            icon: 'history',
          },
        ]
      : [
          { title: 'Personas', route: '../personas', icon: 'user-plus' },
          { title: 'Servicios', route: '../servicios', icon: 'tools' },
          {
            title: 'Configurar servicios',
            route: '../configuracionServicio',
            icon: 'cog',
          },
          {
            title: 'Configuración general',
            route: '../configuracion',
            icon: 'cogs',
          },
          {
            title: 'Registrar servicios',
            route: '../registroServicio',
            icon: 'clipboard-check',
          },
          {
            title: 'Pagos',
            route: '../contabilidad',
            icon: 'file-invoice-dollar',
          },
          {
            title: 'Histórico pagos',
            route: '../contabilidad/historico',
            icon: 'history',
          },
          {
            title: 'Ingresos',
            route: '../ingresos',
            icon: 'dollar-sign',
          },
          {
            title: 'Egresos',
            route: '../egresos',
            icon: 'money-bill-wave',
          },
        ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuButton}
            onPress={() => router.push(item.route as any)}
          >
            <FontAwesome5 name={item.icon} size={30} color="white" />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, alignItems: 'center' },
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
