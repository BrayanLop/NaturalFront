import LoadingView from '@/components/LoadingView';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { toDateInputValue } from '@/utils/formatters';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/authContext';
import { api } from '../api/api';

interface ConsolidadoFormaPago {
  cantidadTransferencia: number;
  totalTransferencia: number;
  cantidadEfectivo: number;
  totalEfectivo: number;
}

export default function ConsolidadoFormaPagoScreen() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConsolidadoFormaPago | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>(toDateInputValue(new Date()));
  const [fechaFin, setFechaFin] = useState<string>(toDateInputValue(new Date()));
  const [pickerVisible, setPickerVisible] = useState<null | 'inicio' | 'fin'>(null);
  const [formaPago, setFormaPago] = useState<'todos' | 'T' | 'E'>('todos');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fechaInicio) params.fechaDesde = fechaInicio + 'T00:00:00';
      if (fechaFin) params.fechaHasta = fechaFin + 'T23:59:59';
      params.formaPago = formaPago !== 'todos' ? formaPago : undefined;
      const res = await api.get('/Contabilidad/ConsolidadoFormaPago', { params });
      console.log('API ConsolidadoFormaPago:', res.data);
      setData(res.data);
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <FontAwesome5 name="credit-card" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Consolidado</Text>
          <Text style={styles.headerSubtitle}>Por forma de pago</Text>
        </View>

        <View style={styles.filtros}>
          <Text style={styles.filtrosLabel}>Rango de fechas</Text>
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

          <Text style={styles.filtrosLabel}>Forma de pago</Text>
          <View style={styles.chipsRow}>
            {[{ key: 'todos', label: 'Todas', icon: 'list' }, { key: 'E', label: 'Efectivo', icon: 'money-bill-wave' }, { key: 'T', label: 'Transferencia', icon: 'exchange-alt' }].map(opt => (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [
                  styles.chip, 
                  formaPago === opt.key && styles.chipActive,
                  pressed && styles.chipPressed
                ]}
                onPress={() => setFormaPago(opt.key as any)}
              >
                <FontAwesome5 
                  name={opt.icon} 
                  size={12} 
                  color={formaPago === opt.key ? COLORS.white : COLORS.textSecondary} 
                />
                <Text style={[styles.chipText, formaPago === opt.key && styles.chipTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.btnBuscar, 
              pressed && styles.btnBuscarPressed,
              loading && styles.btnBuscarDisabled
            ]} 
            onPress={fetchData} 
            disabled={loading}
          >
            <FontAwesome5 name="search" size={14} color={COLORS.white} />
            <Text style={styles.btnBuscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingView />
        ) : (
          <View style={styles.resultadoBox}>
            <View style={styles.resultCard}>
              <View style={[styles.resultIconContainer, { backgroundColor: COLORS.infoLight }]}>
                <FontAwesome5 name="exchange-alt" size={20} color={COLORS.info} />
              </View>
              <Text style={styles.resultadoTitulo}>Transferencia</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Cantidad</Text>
                <Text style={styles.resultValue}>{data?.cantidadTransferencia ?? 0}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total</Text>
                <Text style={[styles.resultValue, styles.resultHighlight]}>
                  ${data?.totalTransferencia?.toLocaleString('es-CO', { minimumFractionDigits: 2 }) ?? '0.00'}
                </Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <View style={[styles.resultIconContainer, { backgroundColor: COLORS.successLight }]}>
                <FontAwesome5 name="money-bill-wave" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.resultadoTitulo}>Efectivo</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Cantidad</Text>
                <Text style={styles.resultValue}>{data?.cantidadEfectivo ?? 0}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total</Text>
                <Text style={[styles.resultValue, { color: COLORS.success }]}>
                  ${data?.totalEfectivo?.toLocaleString('es-CO', { minimumFractionDigits: 2 }) ?? '0.00'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <SimpleDatePicker
        visible={pickerVisible !== null}
        value={pickerVisible === 'inicio' ? fechaInicio : fechaFin}
        onChange={dateStr => {
          if (pickerVisible === 'inicio') setFechaInicio(dateStr);
          if (pickerVisible === 'fin') setFechaFin(dateStr);
          setPickerVisible(null);
        }}
        onClose={() => setPickerVisible(null)}
        title={pickerVisible === 'inicio' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha final'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
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
    borderRadius: RADIUS.lg, 
    padding: SPACING.lg, 
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  filtrosLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dateChip: { 
    flex: 1,
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.md, 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.md, 
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
    fontWeight: FONT_WEIGHT.bold,
  },
  chipsRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    flexWrap: 'wrap', 
    marginBottom: SPACING.lg,
  },
  chip: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.full, 
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { 
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipPressed: {
    transform: [{ scale: 0.95 }],
  },
  chipText: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  chipTextActive: { 
    color: COLORS.white, 
    fontWeight: FONT_WEIGHT.semibold,
  },
  btnBuscar: { 
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary, 
    padding: SPACING.md, 
    borderRadius: RADIUS.md, 
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  btnBuscarPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  btnBuscarDisabled: {
    backgroundColor: COLORS.border,
    ...SHADOWS.none,
  },
  btnBuscarText: { 
    color: COLORS.white, 
    fontWeight: FONT_WEIGHT.semibold, 
    fontSize: FONT_SIZE.md,
  },
  resultadoBox: { 
    gap: SPACING.md,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultadoTitulo: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.text, 
    marginBottom: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  resultValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  resultHighlight: {
    color: COLORS.info,
    fontWeight: FONT_WEIGHT.bold,
  },
});
