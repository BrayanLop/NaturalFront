import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { api } from '../../api/api';

export default function ListaServicios() {
  const router = useRouter();
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/Servicio/Obtener')
      .then(response => {
        setServicios(response.data);
      })
      .catch(error => {
        console.error('Error al cargar servicios:', error);
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicios</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                router.push({ pathname: '/(tabs)/servicios/[id]', params: { id: item.id } })
              }
            >
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text>💰 ${item.precio.toFixed(2)}</Text>
              <Text>
                {item.disponible ? '✅ Disponible' : '❌ No disponible'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/servicios/crear')}
      >
        <Text style={styles.addText}>+ Agregar Servicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 20, fontWeight: 'bold' },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 6,
    backgroundColor: '#f1f2f6',
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
