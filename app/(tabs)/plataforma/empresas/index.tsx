import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS, SPACING } from '@/constants/theme';
import { mensajeDeError } from '@/utils/apiError';
import { logger, showConfirm, showError } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { EmpresaPlataforma } from '../../../api/modelos/empresaPlataforma';
import { plataformaApi } from '../../../api/plataformaApi';

export default function EmpresasPlataforma() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<EmpresaPlataforma[]>([]);
  const [loading, setLoading] = useState(false);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      setEmpresas((await plataformaApi.get('/Empresas')).data);
    } catch (error) {
      logger.error('Error al cargar empresas:', error);
      showError(mensajeDeError(error, 'No se pudieron cargar las empresas'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  const cambiarEstado = async (empresa: EmpresaPlataforma, activa: boolean) => {
    if (!activa) {
      const ok = await showConfirm(
        `¿Desactivar ${empresa.nombre}? Nadie de esa empresa podrá ingresar ni seguir usando la aplicación.`,
        'Desactivar empresa'
      );
      if (!ok) return;
    }
    setCambiando(empresa.id);
    try {
      await plataformaApi.patch(`/Empresas/${empresa.id}/Estado`, null, { params: { activa } });
      setEmpresas((prev) => prev.map((e) => (e.id === empresa.id ? { ...e, activa } : e)));
    } catch (error) {
      showError(mensajeDeError(error, 'No se pudo cambiar el estado de la empresa'));
    } finally {
      setCambiando(null);
    }
  };

  const renderItem = ({ item }: { item: EmpresaPlataforma }) => (
    <ListCard
      title={item.nombre ?? `Empresa ${item.id}`}
      subtitle={`${item.totalPersonas} personas · ${item.accesosActivos}/${item.totalAccesos} accesos activos`}
      badges={<StatusBadge label={item.activa ? 'Activa' : 'Inactiva'} type={item.activa ? 'disponible' : 'rechazado'} />}
      onPress={() => router.push({ pathname: '/plataforma/empresas/[id]', params: { id: String(item.id) } })}
      leftIcon={<FontAwesome5 name="building" size={18} color={item.activa ? COLORS.primary : COLORS.textTertiary} />}
      rightContent={
        <View style={styles.switchBox}>
          <Switch
            value={item.activa}
            disabled={cambiando === item.id}
            onValueChange={(valor) => cambiarEstado(item, valor)}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
          />
        </View>
      }
    />
  );

  return (
    <View style={styles.container}>
      {!loading && empresas.length > 0 && (
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Empresas</Text>
            <Text style={styles.headerSubtitle}>
              {empresas.filter((e) => e.activa).length} activas de {empresas.length}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={() => router.push('/plataforma/empresas/crear')}
          >
            <FontAwesome5 name="plus" size={14} color={COLORS.white} />
          </Pressable>
        </View>
      )}

      {loading ? (
        <LoadingView message="Cargando empresas..." />
      ) : (
        <FlatList
          data={empresas}
          keyExtractor={(e) => String(e.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              message="No hay empresas"
              icon="🏢"
              subtitle="Crea la primera empresa y su administrador"
              actionLabel="Crear empresa"
              onAction={() => router.push('/plataforma/empresas/crear')}
            />
          }
          contentContainerStyle={empresas.length === 0 ? styles.emptyList : undefined}
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
  headerInfo: { flex: 1 },
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
  switchBox: { marginLeft: SPACING.sm },
});
