import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/api';

export default function ListaRegistros() {
  const router = useRouter();
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarRegistros = async () => {
    console.log('[ListaRegistros] Cargando registros...');
    setLoading(true);
    try {
      const response = await api.get('/RegistroServicio/ObtenerRegistros');
      console.log('[ListaRegistros] Respuesta del backend:', response.data);

      if (Array.isArray(response.data)) {
        setRegistros(response.data);
      } else {
        console.warn('⚠️ Los datos recibidos no son un array:', response.data);
        Alert.alert('Error', 'Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('❌ Error al cargar registros:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarRegistros();
    }, [])
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text>🧍 Persona: {item.nombrePersona ?? 'N/A'}</Text>
      <Text>🧾 Servicio: {item.nombreServicio ?? 'N/A'}</Text>
      <Text>🕒 Fecha: {item.fechaServicio ? new Date(item.fechaServicio).toLocaleString() : 'Sin fecha'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item, i) => i.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No hay registros disponibles.</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.navigate('/(tabs)/registroServicio/personas')}
      >
        <Text style={styles.buttonText}>Registrar nuevo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  item: {
    backgroundColor: '#dfe6e9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
