import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
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

interface ConfiguracionServicio {
  id: number;
  nombreServicio: string;
  servicioId: number;
  porcentajeTrabajador: number;
  porcentajeEmpresa: number;
  estado: boolean;
}

export default function ListaConfiguraciones() {
  const router = useRouter();
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionServicio[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarConfiguraciones = async () => {
    setLoading(true);
    try {
      const response = await api.get('ConfiguracionServicio/Obtener');
      setConfiguraciones(response.data);
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarConfiguraciones();
    }, [])
  );

  const renderItem = ({ item }: { item: ConfiguracionServicio }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        router.push({ pathname: '../configuracionServicio/[id]', params: { id: item.id } })
      }
    >
      <Text style={styles.itemText}>⚙️ Servicio: {item.nombreServicio}</Text>
      <Text style={styles.subText}>🏢 Empresa: {item.porcentajeEmpresa}%</Text>
      <Text style={styles.subText}>👷 Trabajador: {item.porcentajeTrabajador}%</Text>
      <Text style={styles.subText}>
        {item.estado ? '✅' : '❌'} Estado: {item.estado ? 'Activo' : 'Inactivo'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : (
        <FlatList
          data={configuraciones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No hay configuraciones registradas.</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('../configuracionServicio/crear')}
      >
        <Text style={styles.addText}>+ Agregar configuración</Text>
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
