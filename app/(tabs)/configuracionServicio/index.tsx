import { Badge, EmptyState, ListRow, LoadingState, PageHeader } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { logger } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { api } from '../../api/api';

interface ConfiguracionServicio {
  id: number;
  nombreServicio: string;
  servicioId: number;
  porcentajeTrabajador: number;
  porcentajeEmpresa: number;
  estado: boolean;
}

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  listaVacia: { flexGrow: 1, justifyContent: 'center' as const },
});

export default function ListaConfiguraciones() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionServicio[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarConfiguraciones = async () => {
    setLoading(true);
    try {
      const response = await api.get('ConfiguracionServicio/Obtener');
      setConfiguraciones(response.data);
    } catch (error) {
      logger.error('Error al cargar configuraciones:', error);
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
      <ListRow
        title={item.nombreServicio}
        subtitle={`Empresa ${item.porcentajeEmpresa}% · Trabajador ${item.porcentajeTrabajador}%`}
        icon="pie-chart-outline"
        badge={<Badge label={item.estado ? 'Activo' : 'Inactivo'} tone={item.estado ? 'success' : 'neutral'} size="sm" />}
        chevron
        onPress={() => handleNavegar(item.id)}
      />
    ),
    [handleNavegar]
  );

  const keyExtractor = useCallback((item: ConfiguracionServicio) => item.id.toString(), []);

  const activas = useMemo(() => configuraciones.filter((c) => c.estado).length, [configuraciones]);

  const emptyComponent = useMemo(
    () => (
      <EmptyState
        icon="settings-outline"
        title="No hay configuraciones"
        subtitle="Comienza agregando una nueva configuración"
        actionLabel="Agregar configuración"
        onAction={handleCrear}
      />
    ),
    [handleCrear]
  );

  return (
    <View style={estilos.contenedor}>
      {!loading && configuraciones.length > 0 && (
        <PageHeader
          title={configuraciones.length === 1 ? '1 configuración' : `${configuraciones.length} configuraciones`}
          subtitle={`${activas} activa${activas !== 1 ? 's' : ''}`}
          action={{ icon: 'add', onPress: handleCrear, label: 'Agregar configuración' }}
        />
      )}

      {loading ? (
        <LoadingState message="Cargando configuraciones..." />
      ) : (
        <FlatList
          data={configuraciones}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={emptyComponent}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          contentContainerStyle={configuraciones.length === 0 ? estilos.listaVacia : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
