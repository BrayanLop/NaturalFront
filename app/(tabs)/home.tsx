import { useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/authContext'; // 👈 Ojo con la ruta

export default function Home() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout(); // Cierra la sesión
    router.replace('/login'); // Redirige al login
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a la app</Text>
      <Button title="Salir" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});
