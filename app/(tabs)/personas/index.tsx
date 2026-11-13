import { EmptyState, ListRow, LoadingState, PageHeader } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { logger } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
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

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  listaVacia: { flexGrow: 1, justifyContent: 'center' as const },
});

export default function ListaPersonas() {
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarPersonas = async () => {
    setLoading(true);
    try {
      const response = await api.get('Persona/Obtener');
      setPersonas(response.data);
    } catch (error) {
      logger.error('Error al cargar personas:', error);
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
      <ListRow
        title={`${item.nombre} ${item.apellido}`}
        subtitle={item.celular || item.email || 'Sin contacto'}
        icon="person-outline"
        chevron
        onPress={() => handleNavegar(item.id)}
      />
    ),
    [handleNavegar]
  );

  const keyExtractor = useCallback((item: Persona) => item.id.toString(), []);

  const emptyComponent = useMemo(
    () => (
      <EmptyState
        icon="people-outline"
        title="No hay personas"
        subtitle="Comienza agregando una nueva persona"
        actionLabel="Agregar persona"
        onAction={handleCrear}
      />
    ),
    [handleCrear]
  );

  return (
    <View style={estilos.contenedor}>
      {!loading && personas.length > 0 && (
        <PageHeader
          title={`${personas.length} persona${personas.length !== 1 ? 's' : ''}`}
          subtitle={`registrada${personas.length !== 1 ? 's' : ''}`}
          action={{ icon: 'add', onPress: handleCrear, label: 'Agregar persona' }}
        />
      )}

      {loading ? (
        <LoadingState message="Cargando personas..." />
      ) : (
        <FlatList
          data={personas}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={emptyComponent}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          contentContainerStyle={personas.length === 0 ? estilos.listaVacia : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
