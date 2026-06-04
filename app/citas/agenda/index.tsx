import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useCitasAuth } from '@/context/citasAuthContext';
import { formatDate } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { citasApi } from '../../api/citasApi';
import { CitaCita, UsuarioCita } from '../../api/modelos/citas';
import { estadoColor } from '../_estado';

export default function AgendaCitas() {
  const router = useRouter();
  const { session } = useCitasAuth();
  const esEmpresa = session?.mode === 'empresa';

  const [citas, setCitas] = useState<CitaCita[]>([]);
  const [usuarios, setUsuarios] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [citasRes, usuariosRes] = await Promise.all([
        citasApi.get<CitaCita[]>('/Citas'),
        citasApi.get<UsuarioCita[]>('/Usuarios').catch(() => ({ data: [] as UsuarioCita[] })),
      ]);

      const mapa: Record<number, string> = {};
      usuariosRes.data.forEach((u) => (mapa[u.id] = u.nombreUsuario));
      setUsuarios(mapa);

      let lista = citasRes.data;
      // El cliente solo ve sus propias citas.
      if (!esEmpresa && session?.userId != null) {
        lista = lista.filter((c) => c.idCliente === session.userId);
      }
      // Más recientes primero.
      lista = [...lista].sort(
        (a, b) => new Date(b.fechaCita).getTime() - new Date(a.fechaCita).getTime()
      );
      setCitas(lista);
    } catch (error) {
      logger.error('[Citas] Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [esEmpresa, session?.userId])
  );

  const handleCrear = useCallback(() => router.push('/citas/agenda/crear'), [router]);

  const renderItem = useCallback(
    ({ item }: { item: CitaCita }) => {
      const hora = item.horaEstimadaCita?.slice(0, 5) ?? '';
      const cliente = usuarios[item.idCliente] ?? `Cliente #${item.idCliente}`;
      const empleado = usuarios[item.idEmpleado] ?? `Empleado #${item.idEmpleado}`;
      return (
        <ListCard
          title={`${formatDate(item.fechaCita)} · ${hora}`}
          subtitle={esEmpresa ? `Cliente: ${cliente}` : `Atiende: ${empleado}`}
          description={esEmpresa ? `Atiende: ${empleado}` : item.observaciones || undefined}
          badges={
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor(item.estado) }]}>
              <Text style={styles.estadoText}>{item.estado}</Text>
            </View>
          }
          onPress={() =>
            router.push({ pathname: '/citas/agenda/[id]', params: { id: String(item.idCita) } })
          }
          leftIcon={<FontAwesome5 name="calendar-day" size={18} color={COLORS.primary} />}
        />
      );
    },
    [usuarios, esEmpresa, router]
  );

  return (
    <View style={styles.container}>
      {!loading && citas.length > 0 && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{esEmpresa ? 'Todas las citas' : 'Mis citas'}</Text>
            <Text style={styles.headerSubtitle}>
              {citas.length} cita{citas.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={handleCrear}
          >
            <FontAwesome5 name="plus" size={14} color={COLORS.white} />
          </Pressable>
        </View>
      )}

      {loading ? (
        <LoadingView message="Cargando citas..." />
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => String(item.idCita)}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              message="No hay citas"
              icon="📅"
              subtitle="Agenda una cita para empezar"
              actionLabel="Agendar cita"
              onAction={handleCrear}
            />
          }
          contentContainerStyle={citas.length === 0 ? styles.emptyList : undefined}
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
  estadoBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  estadoText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
