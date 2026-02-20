import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
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
      <ListCard
        title={item.nombre}
        description={`💰 ${formatCurrency(item.precio)}`}
        badges={
          <StatusBadge
            label={item.disponible ? 'Disponible' : 'No disponible'}
            type={item.disponible ? 'disponible' : 'info'}
          />
        }
        onPress={() => handleNavegar(item.id)}
        leftIcon={<FontAwesome5 name="concierge-bell" size={18} color={COLORS.secondary} />}
      />
    ),
    [handleNavegar]
  );

  const keyExtractor = useCallback((item: Servicio) => item.id.toString(), []);

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
        message="No hay servicios disponibles" 
        icon="💼"
        subtitle="Agrega un nuevo servicio para empezar"
        actionLabel="Agregar servicio"
        onAction={handleCrear}
      />
    ),
    [handleCrear]
  );

  return (
    <View style={styles.container}>
      {/* Header con estadísticas */}
      {!loading && servicios.length > 0 && (
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Servicios</Text>
            <Text style={styles.headerSubtitle}>
              {servicios.length} servicio{servicios.length !== 1 ? 's' : ''} • {servicios.filter(s => s.disponible).length} disponible{servicios.filter(s => s.disponible).length !== 1 ? 's' : ''}
            </Text>
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
        <LoadingView message="Cargando servicios..." />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ListEmptyComponent={emptyComponent}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          contentContainerStyle={servicios.length === 0 ? styles.emptyList : undefined}
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
