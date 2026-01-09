import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import StatusBadge from '@/components/StatusBadge';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { handleApiError } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
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
        <LoadingView />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ListCard
              title={item.nombre}
              description={`💰 ${formatCurrency(item.precio)}`}
              badges={
                <StatusBadge
                  label={item.disponible ? 'Disponible' : 'No disponible'}
                  type={item.disponible ? 'disponible' : 'info'}
                />
              }
              onPress={() =>
                router.push({ pathname: '/(tabs)/servicios/[id]', params: { id: item.id } })
              }
            />
          )}
          ListEmptyComponent={<EmptyState message="No hay servicios disponibles" icon="💼" />}
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
