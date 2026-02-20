import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { api } from '../../api/api';

export type HistorialIngreso = {
  fecha: string;
  totalRegistros: number;
  totalIngresado: number;
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

export default function IngresosEmpresa() {
  const [historial, setHistorial] = useState<HistorialIngreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputValue(start);
  });
  const [fechaHasta, setFechaHasta] = useState(() => toDateInputValue(new Date()));

  const isWeb = Platform.OS === 'web';

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await api.get('Contabilidad/HistorialIngresosEmpresa', {
        params: {
          fechaDesde,
          fechaHasta,
        },
      });
      setHistorial(response.data || []);
    } catch (error) {
      console.error('❌ Error al cargar historial de ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const formatFecha = (valor: string) => {
    const date = new Date(valor);
    return date.toLocaleDateString('es-CO');
  };

  const formatMonto = (valor: number) => {
    return valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalIngresado = historial.reduce((acc, item) => acc + (item.totalIngresado || 0), 0);

  // Date picker handling
  const [pickerVisible, setPickerVisible] = useState<null | 'desde' | 'hasta'>(null);
  const currentPickerDate = pickerVisible === 'desde' ? new Date(fechaDesde) : new Date(fechaHasta);

  const onChangeFecha = (selectedDate?: Date) => {
    if (!selectedDate || !pickerVisible) return;
    const value = toDateInputValue(selectedDate);
    if (pickerVisible === 'desde') setFechaDesde(value);
    if (pickerVisible === 'hasta') setFechaHasta(value);
    setPickerVisible(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Ingresos</Text>
          <Text style={styles.headerSubtitle}>
            {historial.length} día{historial.length !== 1 ? 's' : ''} con registros
          </Text>
        </View>
      </View>

      <View style={styles.filtros}>
        <Text style={styles.filtrosTitle}>Rango de fechas</Text>
        {isWeb ? (
          <View style={styles.row}>
            <View style={styles.dateInputBox}>
              <Text style={styles.chipLabel}>Desde</Text>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={styles.webDateInput as any}
              />
            </View>
            <View style={styles.dateInputBox}>
              <Text style={styles.chipLabel}>Hasta</Text>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={styles.webDateInput as any}
              />
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <Pressable 
              style={({ pressed }) => [styles.dateChip, pressed && styles.dateChipPressed]} 
              onPress={() => setPickerVisible('desde')}
            >
              <Text style={styles.chipLabel}>Desde</Text>
              <Text style={styles.chipValue}>{fechaDesde}</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [styles.dateChip, pressed && styles.dateChipPressed]} 
              onPress={() => setPickerVisible('hasta')}
            >
              <Text style={styles.chipLabel}>Hasta</Text>
              <Text style={styles.chipValue}>{fechaHasta}</Text>
            </Pressable>
          </View>
        )}

        <Pressable 
          style={({ pressed }) => [
            styles.buscarButton, 
            pressed && styles.buscarButtonPressed,
            loading && styles.buscarButtonDisabled,
          ]} 
          onPress={cargarHistorial} 
          disabled={loading}
        >
          <FontAwesome5 name="search" size={14} color={COLORS.white} />
          <Text style={styles.buscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </Pressable>
      </View>

      {/* SimpleDatePicker JS universal */}
      <SimpleDatePicker
        value={fechaDesde}
        onChange={(dateStr) => { setFechaDesde(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'desde'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha desde"
      />
      <SimpleDatePicker
        value={fechaHasta}
        onChange={(dateStr) => { setFechaHasta(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'hasta'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha hasta"
      />

      <View style={styles.resumen}>
        <Text style={styles.resumenLabel}>Total ingresado en rango</Text>
        <Text style={styles.resumenMonto}>{formatMonto(totalIngresado)}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando ingresos...</Text>
        </View>
      ) : historial.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome5 name="money-bill-wave" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No hay ingresos en este rango</Text>
          <Text style={styles.emptySubtitle}>Intenta con otras fechas</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {historial.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <FontAwesome5 name="calendar" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <Text style={styles.registrosLabel}>Registros</Text>
                  <Text style={styles.registros}>{item.totalRegistros}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.total}>{formatMonto(item.totalIngresado)}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
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
  filtros: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  filtrosTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.text 
  },
  row: { 
    flexDirection: 'row', 
    gap: SPACING.md 
  },
  dateChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
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
  },
  chipValue: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.text 
  },
  dateInputBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  webDateInput: {
    width: '100%',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
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
  },
  buscarText: { 
    color: COLORS.white, 
    fontWeight: FONT_WEIGHT.semibold, 
    fontSize: FONT_SIZE.md 
  },
  resumen: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  resumenLabel: { 
    color: COLORS.text, 
    fontWeight: FONT_WEIGHT.medium,
    fontSize: FONT_SIZE.sm,
  },
  resumenMonto: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.bold, 
    fontSize: FONT_SIZE.lg 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.text, 
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fecha: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  cardContent: {
    gap: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registrosLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary,
  },
  registros: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.text,
    fontWeight: FONT_WEIGHT.medium,
  },
  totalLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary,
  },
  total: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.bold,
  },
});
