import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import { COLORS } from '@/constants/theme';
import { logger } from '@/utils/logger';
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
import { personaService } from '../../api/services';

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

  const cargarPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await personaService.obtenerTodas();
      setPersonas(response.data);
    } catch (error) {
      logger.error('Error al cargar personas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresca cuando regresa a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarPersonas();
    }, [cargarPersonas])
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
      <ListCard
        title={`${item.nombre} ${item.apellido}`}
        description={`📱 ${item.celular || 'Sin celular'}`}
        onPress={() => handleNavegar(item.id)}
      />
    ),
    [handleNavegar]
  );

  const keyExtractor = useCallback((item: Persona) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 90,
      offset: 90 * index,
      index,
    }),
    []
  );

  const emptyComponent = useMemo(
    () => <EmptyState message="No hay personas registradas" icon="👥" subtitle="Comienza agregando una nueva persona" />,
    []
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={personas}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ListEmptyComponent={emptyComponent}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          initialNumToRender={10}
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
