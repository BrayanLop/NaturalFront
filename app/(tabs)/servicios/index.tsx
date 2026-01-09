import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { handleApiError } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from '../../api/api';
import { Servicio } from '../../api/modelos/servicio';

export default function ListaServicios() {
  const router = useRouter();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarServicios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/Servicio/Obtener');
      setServicios(response.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarServicios();
    }, [])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
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
              <Text>💰 {formatCurrency(item.precio)}</Text>
              <Text>{item.disponible ? '✅ Disponible' : '❌ No disponible'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>No hay servicios disponibles.</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/servicios/crear')}
      >
        <Text style={styles.addText}>+ Agregar servicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.surface },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
