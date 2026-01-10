import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import StatusBadge from '@/components/StatusBadge';
import { COLORS } from '@/constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
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
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarConfiguraciones();
    }, [])
  );

  const handleNavegar = useCallback(
    (id: number) => {
      router.push({ pathname: '../configuracionServicio/[id]', params: { id } });
    },
    [router]
  );

  const handleCrear = useCallback(() => {
    router.push('../configuracionServicio/crear');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ConfiguracionServicio }) => (
      <ListCard
        title={item.nombreServicio}
        description={`🏢 Empresa: ${item.porcentajeEmpresa}% | 👷 Trabajador: ${item.porcentajeTrabajador}%`}
        badges={
          <StatusBadge
            label={item.estado ? 'Activo' : 'Inactivo'}
            type={item.estado ? 'disponible' : 'info'}
          />
        }
        onPress={() => handleNavegar(item.id)}
      />
    ),
    [handleNavegar]
  );

  const keyExtractor = useCallback((item: ConfiguracionServicio) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 90,
      offset: 90 * index,
      index,
    }),
    []
  );

  const emptyComponent = useMemo(
    () => <EmptyState message="No hay configuraciones registradas" icon="⚙️" subtitle="Comienza agregando una nueva configuración" />,
    []
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={configuraciones}
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
        <Text style={styles.addText}>+ Agregar configuración</Text>
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
