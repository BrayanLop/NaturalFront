import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../../api/api';

type Periodo = 'hoy' | 'semana' | 'mes';

interface ConsolidadoIE {
  totalIngresos: number;
  totalEgresos: number;
  consolidado: number;
}

interface FormaPago {
  cantidadTransferencia: number;
  totalTransferencia: number;
  cantidadEfectivo: number;
  totalEfectivo: number;
}

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
];

const ACCESOS = [
  { title: 'Consolidado', desc: 'Ingresos vs egresos', icon: 'chart-line', color: '#3498db', route: '/(tabs)/consolidadoIngresos' },
  { title: 'Formas de pago', desc: 'Efectivo y transferencia', icon: 'money-check-alt', color: '#1abc9c', route: '/(tabs)/consolidadoFormaPago' },
  { title: 'Ingresos', desc: 'Control de ingresos', icon: 'dollar-sign', color: '#27ae60', route: '/(tabs)/ingresos' },
  { title: 'Egresos', desc: 'Control de gastos', icon: 'money-bill-wave', color: '#e74c3c', route: '/(tabs)/egresos' },
  { title: 'Histórico', desc: 'Historial de pagos', icon: 'history', color: '#8e44ad', route: '/(tabs)/contabilidad/historico' },
];

function getRango(periodo: Periodo): { desde: string; hasta: string } {
  const hoy = new Date();
  let desde = new Date(hoy);
  if (periodo === 'hoy') {
    desde = hoy;
  } else if (periodo === 'semana') {
    const day = hoy.getDay(); // 0=domingo .. 6=sábado
    const diffLunes = day === 0 ? 6 : day - 1;
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - diffLunes);
  } else {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }
  return { desde: toDateInputValue(desde), hasta: toDateInputValue(hoy) };
}

export default function Finanzas() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [loading, setLoading] = useState(false);
  const [ie, setIe] = useState<ConsolidadoIE | null>(null);
  const [fp, setFp] = useState<FormaPago | null>(null);

  const esAdmin = isAdmin(usuario?.rol);

  const fetchData = useCallback(async (p: Periodo) => {
    setLoading(true);
    try {
      const { desde, hasta } = getRango(p);
      const [resIe, resFp] = await Promise.all([
        api.get('/Contabilidad/ConsolidadoIngresosEgresos', {
          params: { fechaDesde: desde, fechaHasta: hasta },
        }),
        api.get('/Contabilidad/ConsolidadoFormaPago', {
          params: { fechaDesde: desde + 'T00:00:00', fechaHasta: hasta + 'T23:59:59' },
        }),
      ]);
      setIe(resIe.data);
      setFp(resFp.data);
    } catch (e) {
      logger.error('Error cargando finanzas:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (esAdmin) fetchData(periodo);
    }, [esAdmin, periodo, fetchData])
  );

  const cambiarPeriodo = (p: Periodo) => {
    setPeriodo(p);
    fetchData(p);
  };

  if (!esAdmin) {
    return (
      <View style={styles.centered}>
        <FontAwesome5 name="lock" size={40} color={COLORS.textTertiary} />
        <Text style={styles.deniedText}>Solo los administradores pueden ver las finanzas.</Text>
      </View>
    );
  }

  // Cálculo de proporciones de forma de pago
  const totalFP = (fp?.totalEfectivo ?? 0) + (fp?.totalTransferencia ?? 0);
  const pctEfectivo = totalFP > 0 ? Math.round(((fp?.totalEfectivo ?? 0) / totalFP) * 100) : 0;
  const pctTransfer = totalFP > 0 ? 100 - pctEfectivo : 0;

  const utilidad = ie?.consolidado ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Selector de período */}
        <View style={styles.periodoRow}>
          {PERIODOS.map((p) => (
            <Pressable
              key={p.key}
              style={[styles.periodoChip, periodo === p.key && styles.periodoChipActive]}
              onPress={() => cambiarPeriodo(p.key)}
            >
              <Text style={[styles.periodoText, periodo === p.key && styles.periodoTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando métricas...</Text>
          </View>
        ) : (
          <>
            {/* KPIs */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderLeftColor: COLORS.success }]}>
                <View style={[styles.kpiIcon, { backgroundColor: COLORS.successLight }]}>
                  <FontAwesome5 name="arrow-up" size={14} color={COLORS.success} />
                </View>
                <Text style={styles.kpiLabel}>Ingresos</Text>
                <Text style={[styles.kpiValue, { color: COLORS.success }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(ie?.totalIngresos ?? 0)}
                </Text>
              </View>

              <View style={[styles.kpiCard, { borderLeftColor: COLORS.error }]}>
                <View style={[styles.kpiIcon, { backgroundColor: COLORS.errorLight }]}>
                  <FontAwesome5 name="arrow-down" size={14} color={COLORS.error} />
                </View>
                <Text style={styles.kpiLabel}>Egresos</Text>
                <Text style={[styles.kpiValue, { color: COLORS.error }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(ie?.totalEgresos ?? 0)}
                </Text>
              </View>
            </View>

            {/* Utilidad destacada */}
            <View style={styles.utilidadCard}>
              <View style={styles.utilidadHeader}>
                <FontAwesome5 name="wallet" size={16} color={COLORS.white} />
                <Text style={styles.utilidadLabel}>Utilidad neta</Text>
              </View>
              <Text style={styles.utilidadValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(utilidad)}
              </Text>
              <Text style={styles.utilidadHint}>Ingresos − Egresos</Text>
            </View>

            {/* Formas de pago */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Formas de pago</Text>
              {totalFP === 0 ? (
                <Text style={styles.emptyText}>Sin movimientos en este período</Text>
              ) : (
                <>
                  <View style={styles.fpRow}>
                    <View style={styles.fpHeaderRow}>
                      <Text style={styles.fpLabel}>💵 Efectivo</Text>
                      <Text style={styles.fpAmount}>
                        {formatCurrency(fp?.totalEfectivo ?? 0)} · {pctEfectivo}%
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pctEfectivo}%`, backgroundColor: COLORS.success }]} />
                    </View>
                  </View>

                  <View style={styles.fpRow}>
                    <View style={styles.fpHeaderRow}>
                      <Text style={styles.fpLabel}>💳 Transferencia</Text>
                      <Text style={styles.fpAmount}>
                        {formatCurrency(fp?.totalTransferencia ?? 0)} · {pctTransfer}%
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pctTransfer}%`, backgroundColor: COLORS.info }]} />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Accesos a detalle */}
            <Text style={styles.sectionTitle}>Ver detalle</Text>
            <View style={styles.accesosGrid}>
              {ACCESOS.map((a) => (
                <Pressable
                  key={a.title}
                  style={({ pressed }) => [styles.accesoCard, pressed && styles.accesoCardPressed]}
                  onPress={() => router.push(a.route as any)}
                >
                  <View style={[styles.accesoIcon, { backgroundColor: a.color }]}>
                    <FontAwesome5 name={a.icon} size={16} color={COLORS.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accesoTitle}>{a.title}</Text>
                    <Text style={styles.accesoDesc} numberOfLines={1}>{a.desc}</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color={COLORS.textTertiary} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  deniedText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  periodoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  periodoChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  periodoChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodoText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  periodoTextActive: { color: COLORS.white },
  loadingBox: { paddingVertical: SPACING.huge, alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  kpiRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  kpiLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  kpiValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  utilidadCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.primary,
  },
  utilidadHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  utilidadLabel: { fontSize: FONT_SIZE.sm, color: COLORS.white, fontWeight: FONT_WEIGHT.semibold, opacity: 0.9 },
  utilidadValue: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
  utilidadHint: { fontSize: FONT_SIZE.xs, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.md },
  fpRow: { marginBottom: SPACING.md },
  fpHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  fpLabel: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: FONT_WEIGHT.medium },
  fpAmount: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold },
  barTrack: {
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: RADIUS.full },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  accesosGrid: { gap: SPACING.sm },
  accesoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  accesoCardPressed: { backgroundColor: COLORS.surface, transform: [{ scale: 0.99 }] },
  accesoIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accesoTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  accesoDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
});
