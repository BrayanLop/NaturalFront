import EmptyState from '@/components/EmptyState';
import ListCard from '@/components/ListCard';
import LoadingView from '@/components/LoadingView';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger, showError } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { api } from '../../api/api';
import { EgresoEmpresa } from '../../api/modelos/egreso';

export default function ListaEgresos() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [egresos, setEgresos] = useState<EgresoEmpresa[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputValue(start);
  });
  const [fechaFin, setFechaFin] = useState(() => toDateInputValue(new Date()));
  const [pickerVisible, setPickerVisible] = useState<null | 'inicio' | 'fin'>(null);

  const esAdmin = isAdmin(usuario?.rol);

  const cargarEgresos = useCallback(async () => {
    if (!esAdmin) return;
    
    setLoading(true);
    try {
      const response = await api.get('/EgresosEmpresa/ObtenerEgresosPorRango', {
        params: {
          fechaInicio,
          fechaFin,
        },
      });
      setEgresos(response.data || []);
    } catch (error: any) {
      logger.error('Error al cargar egresos:', error);
      showError('No se pudieron cargar los egresos');
    } finally {
      setLoading(false);
    }
  }, [esAdmin, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarEgresos();
  }, []);

  const totalEgresos = useMemo(
    () => egresos.reduce((acc, item) => acc + (item.valorEgreso || 0), 0),
    [egresos]
  );

  const handleCrear = useCallback(() => {
    router.push('/(tabs)/egresos/crear');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: EgresoEmpresa }) => (
      <ListCard
        title={item.nombrePersona || 'Sin persona'}
        subtitle={`💵 ${formatCurrency(item.valorEgreso)}`}
        description={item.motivo || 'Sin motivo'}
        leftIcon={<FontAwesome5 name="arrow-down" size={16} color={COLORS.error} />}
        rightContent={
          <Text style={styles.fecha}>
            {item.fechaRegistro ? formatDate(item.fechaRegistro) : 'Sin fecha'}
          </Text>
        }
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: EgresoEmpresa, index: number) => `${item.empresaId}-${item.personaId}-${index}`, []);

  const emptyComponent = useMemo(
    () => (
      <EmptyState 
        message="No hay egresos en el rango seleccionado" 
        icon="💸"
        subtitle="Ajusta las fechas o registra un nuevo egreso"
        actionLabel="Registrar egreso"
        onAction={handleCrear}
      />
    ),
    [handleCrear]
  );

  if (!esAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No tienes permisos para ver esta sección</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Egresos</Text>
          <Text style={styles.headerSubtitle}>
            {egresos.length} registro{egresos.length !== 1 ? 's' : ''} encontrado{egresos.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.headerAddButton,
            pressed && styles.headerAddButtonPressed,
          ]}
          onPress={handleCrear}
        >
          <FontAwesome5 name="plus" size={18} color={COLORS.white} />
        </Pressable>
      </View>

      <View style={styles.filtros}>
        <Text style={styles.filtrosTitle}>Filtrar por fechas</Text>
        <View style={styles.dateRow}>
          <Pressable 
            style={({ pressed }) => [styles.dateChip, pressed && styles.dateChipPressed]} 
            onPress={() => setPickerVisible('inicio')}
          >
            <Text style={styles.chipLabel}>Desde</Text>
            <Text style={styles.chipValue}>{fechaInicio}</Text>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.dateChip, pressed && styles.dateChipPressed]} 
            onPress={() => setPickerVisible('fin')}
          >
            <Text style={styles.chipLabel}>Hasta</Text>
            <Text style={styles.chipValue}>{fechaFin}</Text>
          </Pressable>
        </View>
        <Pressable 
          style={({ pressed }) => [
            styles.buscarButton, 
            pressed && styles.buscarButtonPressed,
            loading && styles.buscarButtonDisabled,
          ]} 
          onPress={cargarEgresos} 
          disabled={loading}
        >
          <FontAwesome5 name="search" size={14} color={COLORS.white} />
          <Text style={styles.buscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </Pressable>
      </View>

      {/* Pickers para dispositivos móviles */}
      <SimpleDatePicker
        value={fechaInicio}
        onChange={(dateStr) => { setFechaInicio(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'inicio'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha desde"
      />
      <SimpleDatePicker
        value={fechaFin}
        onChange={(dateStr) => { setFechaFin(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'fin'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha hasta"
      />

      <View style={styles.resumen}>
        <Text style={styles.resumenLabel}>Total egresos en rango</Text>
        <Text style={styles.resumenMonto}>{formatCurrency(totalEgresos)}</Text>
      </View>

      {loading ? (
        <LoadingView message="Cargando egresos..." />
      ) : (
        <FlatList
          data={egresos}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={egresos.length === 0 ? styles.emptyList : undefined}
        />
      )}

      {egresos.length > 0 && (
        <Pressable 
          style={({ pressed }) => [
            styles.addButton, 
            pressed && styles.addButtonPressed,
          ]} 
          onPress={handleCrear}
        >
          <Text style={styles.addText}>+ Registrar egreso</Text>
        </Pressable>
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
  filtros: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  filtrosTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateChipPressed: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  chipValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: FONT_WEIGHT.semibold,
  },
  buscarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    ...SHADOWS.primary,
  },
  buscarButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  buscarButtonDisabled: {
    backgroundColor: COLORS.border,
    ...SHADOWS.none,
  },
  buscarText: { 
    color: COLORS.white, 
    fontWeight: FONT_WEIGHT.semibold, 
    fontSize: FONT_SIZE.sm 
  },
  resumen: {
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  resumenLabel: { 
    color: COLORS.text, 
    fontWeight: FONT_WEIGHT.medium,
    fontSize: FONT_SIZE.sm,
  },
  resumenMonto: { 
    color: COLORS.error, 
    fontWeight: FONT_WEIGHT.bold, 
    fontSize: FONT_SIZE.lg,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  fecha: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
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
  errorText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
});
