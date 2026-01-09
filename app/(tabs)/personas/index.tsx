import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  residencia: string;
  email: string;
  edad: number;
  celular?: string;
  fechaNacimiento: string;
}

export default function ListaPersonas() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarPersonas = async () => {
    setLoading(true);
    try {
      const response = await api.get('Persona/Obtener');
      setPersonas(response.data);
    } catch (error) {
      console.error('Error al cargar personas:', error);
      Alert.alert('Error', 'No se pudieron cargar las personas');
    } finally {
      setLoading(false);
    }
  };

  // Refresca cuando regresa a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarPersonas();
    }, [])
  );

  const handleNavegar = useCallback(
    (id: number) => {
      router.push({ pathname: '/personas/[id]', params: { id } });
    },
    [router]
  );

  const handleCrear = useCallback(() => {
    router.push('/personas/crear');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: Persona }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleNavegar(item.id)}
      >
        <Text style={styles.itemText}>👤 {item.nombre} {item.apellido}</Text>
        <Text style={styles.subText}>📱 {item.celular}</Text>
      </TouchableOpacity>
    ),
    [handleNavegar]
  );

  const keyExtractor = useCallback((item: Persona) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 60,
      offset: 60 * index,
      index,
    }),
    []
  );

  const emptyComponent = useMemo(
    () => <Text>No hay personas registradas.</Text>,
    []
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : (
        <FlatList
          data={personas}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ListEmptyComponent={emptyComponent}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleCrear}
      >
        <Text style={styles.addText}>+ Agregar persona</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  subText: {
    fontSize: 14,
    color: '#636e72',
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
