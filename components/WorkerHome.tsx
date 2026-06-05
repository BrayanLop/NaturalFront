import { api } from '@/app/api/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Resumen {
  realizados: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  comisionAcum: number;
  propinasAcum: number;
  deducciones: number;
}

const VACIO: Resumen = {
  realizados: 0,
  aprobados: 0,
  pendientes: 0,
  rechazados: 0,
  comisionAcum: 0,
  propinasAcum: 0,
  deducciones: 0,
};

export default function WorkerHome() {
  const { usuario, isDemo } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Resumen>(VACIO);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario?.id) return;
    try {
      // Rango: últimos 60 días (cubre lo no liquidado del período actual)
      const hoy = new Date();
      const desde = new Date(hoy);
      desde.setDate(hoy.getDate() - 60);

      const params: any = {
        personaId: usuario.id,
        fechaInicio: new Date(toDateInputValue(desde) + 'T00:00:00').toISOString(),
        fechaFin: new Date(toDateInputValue(hoy) + 'T23:59:59').toISOString(),
      };

      const resReg = await api.get('/RegistroServicio/ObtenerRegistros', { params });
      const registros: any[] = Array.isArray(resReg.data) ? resReg.data : [];

      const hoyStr = toDateInputValue(hoy);
      let realizados = 0, aprobados = 0, pendientes = 0, rechazados = 0;
      let comisionAcum = 0, propinasAcum = 0;

      registros.forEach((r) => {
        const fechaStr = (r.fechaServicio || '').split('T')[0];
        const aprobado = (r.confirmado || r.liquidado) && !r.rechazado;

        // Resumen de HOY
        if (fechaStr === hoyStr) {
          realizados++;
          if (r.rechazado) rechazados++;
          else if (aprobado) aprobados++;
          else pendientes++;
        }

        // Comisión por cobrar: aprobada y aún no liquidada
        if (aprobado && !r.liquidado) {
          comisionAcum += Number(r.comision) || 0;
        }
        // Propinas pendientes: aprobadas y aún NO entregadas al trabajador
        if (aprobado && !r.propinaPagada) {
          propinasAcum += Number(r.propina) || 0;
        }
      });

      // Deducciones pendientes (best-effort; puede no estar disponible para el rol)
      let deducciones = 0;
      try {
        const resEg = await api.get('/EgresosEmpresa/ObtenerEgresosPorPersona', {
          params: { personaId: usuario.id },
        });
        const egresos: any[] = Array.isArray(resEg.data) ? resEg.data : [];
        deducciones = egresos
          .filter((e) => e.seDescuenta && !e.liquidado)
          .reduce((acc, e) => acc + (Number(e.valorEgreso) || 0), 0);
      } catch {
        deducciones = 0;
      }

      setData({ realizados, aprobados, pendientes, rechazados, comisionAcum, propinasAcum, deducciones });
    } catch (e) {
      logger.error('Error cargando resumen del trabajador:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [usuario?.id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  const saldoEstimado = data.comisionAcum + data.propinasAcum - data.deducciones;

  const stats = [
    { label: 'Realizados', value: data.realizados, color: COLORS.primary, icon: 'clipboard-list' },
    { label: 'Aprobados', value: data.aprobados, color: COLORS.success, icon: 'check-circle' },
    { label: 'Pendientes', value: data.pendientes, color: '#f39c12', icon: 'clock' },
    { label: 'Rechazados', value: data.rechazados, color: COLORS.error, icon: 'times-circle' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Saludo */}
      <View style={styles.welcome}>
        <Text style={styles.hola}>¡Hola,</Text>
        <Text style={styles.nombre}>{usuario?.nombre?.split(' ')[0] || 'Trabajador'}! 👋</Text>
      </View>

      {isDemo && (
        <View style={styles.demoBanner}>
          <FontAwesome5 name="rocket" size={14} color={COLORS.warningDark} />
          <Text style={styles.demoText}>Modo prueba — datos de demostración</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {/* Resumen de hoy */}
          <Text style={styles.sectionTitle}>Resumen de hoy</Text>
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '1A' }]}>
                  <FontAwesome5 name={s.icon} size={14} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Mi saldo acumulado */}
          <Text style={styles.sectionTitle}>Mi saldo acumulado</Text>
          <View style={styles.saldoCard}>
            <View style={styles.saldoRow}>
              <Text style={styles.saldoLabel}>Comisión acumulada</Text>
              <Text style={styles.saldoValue}>{formatCurrency(data.comisionAcum)}</Text>
            </View>
            <View style={styles.saldoRow}>
              <Text style={styles.saldoLabel}>Propinas acumuladas</Text>
              <Text style={[styles.saldoValue, { color: COLORS.success }]}>{formatCurrency(data.propinasAcum)}</Text>
            </View>
            <View style={styles.saldoRow}>
              <Text style={styles.saldoLabel}>Deducciones pendientes</Text>
              <Text style={[styles.saldoValue, { color: COLORS.error }]}>
                {data.deducciones > 0 ? `- ${formatCurrency(data.deducciones)}` : formatCurrency(0)}
              </Text>
            </View>

            <View style={styles.saldoDivider} />

            <View style={styles.saldoTotalBox}>
              <Text style={styles.saldoTotalLabel}>Saldo estimado a recibir</Text>
              <Text style={styles.saldoTotalValue}>{formatCurrency(saldoEstimado)}</Text>
            </View>
            <Text style={styles.saldoHint}>
              Este valor se paga en la liquidación. Las propinas son 100% tuyas.
            </Text>
          </View>

          {/* Acciones rápidas */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={() => router.push('/(tabs)/registroServicio')}
          >
            <FontAwesome5 name="plus" size={16} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Registrar servicio</Text>
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
              onPress={() => router.push('/(tabs)/contabilidad')}
            >
              <FontAwesome5 name="file-invoice-dollar" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>Mis pagos</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
              onPress={() => router.push('/(tabs)/contabilidad/historico')}
            >
              <FontAwesome5 name="history" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>Histórico</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  welcome: { marginBottom: SPACING.lg },
  hola: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  nombre: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  demoText: { fontSize: FONT_SIZE.xs, color: COLORS.warningDark, fontWeight: FONT_WEIGHT.medium },
  loadingBox: { paddingVertical: SPACING.huge, alignItems: 'center' },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  saldoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  saldoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  saldoValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  saldoDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  saldoTotalBox: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saldoTotalLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  saldoTotalValue: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  saldoHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.primary,
  },
  primaryBtnPressed: { backgroundColor: COLORS.primaryDark, transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  secondaryRow: { flexDirection: 'row', gap: SPACING.md },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  secondaryBtnPressed: { backgroundColor: COLORS.surface },
  secondaryBtnText: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
});
