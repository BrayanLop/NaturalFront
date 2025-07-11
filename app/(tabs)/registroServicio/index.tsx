import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
  const { persona } = useLocalSearchParams();
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarRegistros = async () => {
    if (!persona) return;
    setLoading(true);
    try {
      const response = await api.get(`/RegistroServicio/ObtenerPorPersona/${persona}`);
      setRegistros(response.data);
    } catch (error) {
      console.error('Error al cargar registros:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarRegistros();
    }, [persona])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>🧍 Persona: {item.nombrePersona}</Text>
              <Text>🧾 Servicios: {item.nombreServicio.join(', ')}</Text>
              <Text>🕒 Fecha: {new Date(item.fecha).toLocaleString()}</Text>
            </View>
          )}
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
