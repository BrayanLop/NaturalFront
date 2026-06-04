import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { citasApi } from '../../api/citasApi';
import { ServicioCita } from '../../api/modelos/citas';

export default function ServiciosCitas() {
  const router = useRouter();
  const { session } = useCitasAuth();
  const esEmpresa = session?.mode === 'empresa';

  const [servicios, setServicios] = useState<ServicioCita[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await citasApi.get<ServicioCita[]>('/Servicios');
      setServicios(data);
    } catch (error) {
      logger.error('[Citas] Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  const handleCrear = useCallback(() => router.push('/citas/servicios/crear'), [router]);

  const renderItem = useCallback(
    ({ item }: { item: ServicioCita }) => (
      <ListCard
        title={item.nombreServicio}
        subtitle={`⏱ ${item.tiempoEstimado} min`}
        description={`💰 ${formatCurrency(item.valor)}`}
        onPress={
          esEmpresa
            ? () =>
                router.push({
                  pathname: '/citas/servicios/[id]',
                  params: { id: String(item.idServicio) },
                })
            : undefined
        }
        leftIcon={<FontAwesome5 name="concierge-bell" size={18} color={COLORS.secondary} />}
      />
    ),
    [esEmpresa, router]
  );

  return (
    <View style={styles.container}>
      {!loading && servicios.length > 0 && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Servicios</Text>
            <Text style={styles.headerSubtitle}>
              {servicios.length} servicio{servicios.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {esEmpresa && (
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              onPress={handleCrear}
            >
              <FontAwesome5 name="plus" size={14} color={COLORS.white} />
            </Pressable>
          )}
        </View>
      )}

      {loading ? (
        <LoadingView message="Cargando servicios..." />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => String(item.idServicio)}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              message="No hay servicios"
              icon="💼"
              subtitle={
                esEmpresa
                  ? 'Agrega un nuevo servicio para empezar'
                  : 'Aún no hay servicios disponibles'
              }
              actionLabel={esEmpresa ? 'Agregar servicio' : undefined}
              onAction={esEmpresa ? handleCrear : undefined}
            />
          }
          contentContainerStyle={servicios.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  headerSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  addButtonPressed: { backgroundColor: COLORS.primaryDark, transform: [{ scale: 0.95 }] },
  emptyList: { flex: 1, justifyContent: 'center' },
});
