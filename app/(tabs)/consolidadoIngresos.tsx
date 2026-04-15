import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { toDateInputValue } from '../../utils/formatters';
import { api } from '../api/api';

export default function ConsolidadoIngresos() {
  const { usuario } = useAuth();
  // Filtros de fecha igual que en egresos
  const today = new Date();
  const fechaActual = toDateInputValue(today);
  const [fechaDesde, setFechaDesde] = useState<string>(fechaActual);
  const [fechaHasta, setFechaHasta] = useState<string>(fechaActual);
  const [pickerVisible, setPickerVisible] = useState<null | 'desde' | 'hasta'>(null);
  const [loading, setLoading] = useState(false);
  const [consolidado, setConsolidado] = useState<{
    totalIngresos: number;
    totalEgresos: number;
    consolidado: number;
  } | null>(null);
  // Eliminado filtro de persona

  // Ejecutar filtro automáticamente al cargar (solo para admin)
  const firstLoad = useRef(true);
  useEffect(() => {
    if (usuario?.rol !== '01') {
      Alert.alert('Acceso denegado', 'Solo administradores pueden ver el consolidado.');
    } else if (firstLoad.current) {
      firstLoad.current = false;
      fetchConsolidado();
    }
    // No ejecutar fetchConsolidado al cambiar fechas, solo al cargar
  }, [usuario]);

  const fetchConsolidado = async () => {
    if (usuario?.rol !== '01') return;
    setLoading(true);
    try {
      const params: any = {
        fechaDesde,
        fechaHasta,
      };
      // Eliminado filtro de persona
      const res = await api.get('/Contabilidad/ConsolidadoIngresosEgresos', { params });
      setConsolidado({
        totalIngresos: res.data.totalIngresos,
        totalEgresos: res.data.totalEgresos,
        consolidado: res.data.consolidado,
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo obtener el consolidado');
    } finally {
      setLoading(false);
    }
  };

  // Utilidades para input date (importado arriba)
  // Handler para SimpleDatePicker
  const onChangeFecha = (dateStr?: string) => {
    if (!dateStr || !pickerVisible) return;
    if (pickerVisible === 'desde') setFechaDesde(dateStr);
    if (pickerVisible === 'hasta') setFechaHasta(dateStr);
    setPickerVisible(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <FontAwesome5 name="chart-line" size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Consolidado</Text>
        <Text style={styles.headerSubtitle}>Ingresos y Egresos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.filtros}>
          <Text style={styles.label}>Rango de fechas</Text>
          <View style={styles.dateRow}>
            <Pressable 
              style={({ pressed }) => [styles.dateInputBox, pressed && styles.dateInputBoxPressed]} 
              onPress={() => setPickerVisible('desde')}
            >
              <Text style={styles.chipLabel}>Desde</Text>
              <Text style={styles.dateValue}>{fechaDesde}</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [styles.dateInputBox, pressed && styles.dateInputBoxPressed]}
              onPress={() => setPickerVisible('hasta')}
            >
              <Text style={styles.chipLabel}>Hasta</Text>
              <Text style={styles.dateValue}>{fechaHasta}</Text>
            </Pressable>
          </View>
          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled
            ]} 
            onPress={fetchConsolidado} 
            disabled={loading}
          >
            <FontAwesome5 name="search" size={14} color={COLORS.white} />
            <Text style={styles.buttonText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
          </Pressable>
        </View>

        {consolidado && (
          <View style={styles.resultBox}>
            <View style={styles.resultItem}>
              <View style={styles.resultIconContainer}>
                <FontAwesome5 name="arrow-up" size={16} color={COLORS.success} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultLabel}>Total Ingresos</Text>
                <Text style={[styles.resultValue, styles.ingresos]}>
                  {(consolidado.totalIngresos ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultItem}>
              <View style={[styles.resultIconContainer, styles.resultIconEgresos]}>
                <FontAwesome5 name="arrow-down" size={16} color={COLORS.error} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultLabel}>Total Egresos</Text>
                <Text style={[styles.resultValue, styles.egresos]}>
                  {(consolidado.totalEgresos ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.consolidadoBox}>
              <Text style={styles.consolidadoLabel}>Consolidado</Text>
              <Text style={[styles.consolidadoValue, (consolidado.consolidado ?? 0) >= 0 ? styles.ingresos : styles.egresos]}>
                {(consolidado.consolidado ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <SimpleDatePicker
        value={pickerVisible === 'desde' ? fechaDesde : fechaHasta}
        onChange={onChangeFecha}
        visible={pickerVisible !== null}
        onClose={() => setPickerVisible(null)}
        title={pickerVisible === 'desde' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha final'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
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
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  label: { 
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
  dateInputBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateInputBoxPressed: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  chipLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.xs,
  },
  dateValue: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.text,
    fontWeight: FONT_WEIGHT.semibold,
  },
  button: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  buttonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    ...SHADOWS.none,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
  resultBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIconEgresos: {
    backgroundColor: COLORS.errorLight,
  },
  resultInfo: {
    flex: 1,
  },
  resultLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  resultValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  consolidadoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  consolidadoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  consolidadoValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  ingresos: {
    color: COLORS.success,
  },
  egresos: {
    color: COLORS.error,
  },
});
