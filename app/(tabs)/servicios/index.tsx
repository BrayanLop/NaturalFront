import { Badge, EmptyState, ListRow, LoadingState, PageHeader } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { api } from '../../api/api';
import { Servicio } from '../../api/modelos/servicio';

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  listaVacia: { flexGrow: 1, justifyContent: 'center' as const },
});

export default function ListaServicios() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarServicios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/Servicio/Obtener');
      setServicios(response.data);
    } catch (error) {
      logger.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarServicios();
    }, [])
  );

  const handleNavegar = useCallback(
    (id: number) => {
      router.push({ pathname: '/(tabs)/servicios/[id]', params: { id } });
    },
    [router]
  );

  const handleCrear = useCallback(() => {
    router.push('/(tabs)/servicios/crear');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: Servicio }) => (
      <ListRow
        title={item.nombre}
        subtitle={formatCurrency(item.precio)}
        icon="briefcase-outline"
        badge={
          <Badge
            label={item.disponible ? 'Disponible' : 'No disponible'}
            tone={item.disponible ? 'success' : 'neutral'}
            size="sm"
          />
        }
        chevron
        onPress={() => handleNavegar(item.id)}
      />
    ),
    [handleNavegar]
  );

  const keyExtractor = useCallback((item: Servicio) => item.id.toString(), []);

  const disponibles = useMemo(() => servicios.filter((s) => s.disponible).length, [servicios]);

  const emptyComponent = useMemo(
    () => (
      <EmptyState
        icon="briefcase-outline"
        title="No hay servicios"
        subtitle="Agrega un nuevo servicio para empezar"
        actionLabel="Agregar servicio"
        onAction={handleCrear}
      />
    ),
    [handleCrear]
  );

  return (
    <View style={estilos.contenedor}>
      {!loading && servicios.length > 0 && (
        <PageHeader
          title={`${servicios.length} servicio${servicios.length !== 1 ? 's' : ''}`}
          subtitle={`${disponibles} disponible${disponibles !== 1 ? 's' : ''}`}
          action={{ icon: 'add', onPress: handleCrear, label: 'Agregar servicio' }}
        />
      )}

      {loading ? (
        <LoadingState message="Cargando servicios..." />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={emptyComponent}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          contentContainerStyle={servicios.length === 0 ? estilos.listaVacia : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
