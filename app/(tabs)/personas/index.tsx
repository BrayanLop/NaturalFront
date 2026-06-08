import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { logger } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
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
        description={item.celular ? `📱 ${item.celular}` : item.email || 'Sin contacto'}
        onPress={() => handleNavegar(item.id)}
        leftIcon={<FontAwesome5 name="user" size={18} color={COLORS.primary} />}
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
    () => (
      <EmptyState 
        message="No hay personas registradas" 
        icon="👥" 
        subtitle="Comienza agregando una nueva persona"
        actionLabel="Agregar persona"
        onAction={handleCrear}
      />
    ),
    [handleCrear]
  );

  return (
    <View style={styles.container}>
      {/* Header con estadísticas */}
      {!loading && personas.length > 0 && (
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Personas</Text>
            <Text style={styles.headerSubtitle}>{personas.length} registrado{personas.length !== 1 ? 's' : ''}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.headerAddButton,
              pressed && styles.headerAddButtonPressed,
            ]}
            onPress={handleCrear}
          >
            <FontAwesome5 name="plus" size={14} color={COLORS.white} />
          </Pressable>
        </View>
      )}

      {loading ? (
        <LoadingView message="Cargando personas..." />
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
          contentContainerStyle={personas.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.lg, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  headerAddButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.95 }],
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  addButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  addButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  addText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
});
