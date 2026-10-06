import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../../api/api';
import { ConsolidadoFormaPago, ConsolidadoIngresosEgresos } from '../../api/modelos/contabilidad';

type Periodo = 'hoy' | 'semana' | 'mes' | 'personalizado';

type ConsolidadoIE = ConsolidadoIngresosEgresos;
type FormaPago = ConsolidadoFormaPago;

// Fila del movimiento de caja; se omite si el back (antiguo) no envía el campo
function FilaFlujo({ label, valor, signo, destacado }: { label: string; valor?: number | null; signo?: '-'; destacado?: boolean }) {
  if (valor === undefined || valor === null) return null;
  return (
    <View style={[styles.flujoRow, destacado && styles.flujoRowDestacado]}>
      <Text style={[styles.flujoLabel, destacado && styles.flujoLabelDestacado]}>{label}</Text>
      <Text
        style={[
          styles.flujoValor,
          signo === '-' && { color: COLORS.error },
          destacado && { color: valor >= 0 ? COLORS.successDark : COLORS.error, fontWeight: FONT_WEIGHT.bold },
        ]}
      >
        {signo === '-' && valor !== 0 ? '− ' : ''}
        {formatCurrency(valor)}
      </Text>
    </View>
  );
}

// Encabezado de sección con una línea de ayuda
function Seccion({ icon, titulo, ayuda }: { icon: string; titulo: string; ayuda: string }) {
  return (
    <View style={styles.seccionHeader}>
      <View style={styles.seccionTituloRow}>
        <FontAwesome5 name={icon} size={14} color={COLORS.primary} />
        <Text style={styles.seccionTitulo}>{titulo}</Text>
      </View>
      <Text style={styles.seccionAyuda}>{ayuda}</Text>
    </View>
  );
}

const definido = (v?: number | null): v is number => v !== undefined && v !== null;

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'personalizado', label: 'Rango' },
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
  const hoyStr = toDateInputValue(new Date());
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [desde, setDesde] = useState<string>(hoyStr);
  const [hasta, setHasta] = useState<string>(hoyStr);
  const [pickerVisible, setPickerVisible] = useState<null | 'desde' | 'hasta'>(null);
  const [loading, setLoading] = useState(false);
  const [ie, setIe] = useState<ConsolidadoIE | null>(null);
  const [fp, setFp] = useState<FormaPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rangoConsultado, setRangoConsultado] = useState<{ desde: string; hasta: string } | null>(null);

  const esAdmin = isAdmin(usuario?.rol);

  // El rango personalizado se guarda también en un ref para que el efecto de
  // foco pueda releer la última selección sin re-ejecutarse en cada cambio.
  const rangoRef = useRef({ desde: hoyStr, hasta: hoyStr });

  const fetchData = useCallback(async (d: string, h: string) => {
    setLoading(true);
    setError(null);
    try {
      const [resIe, resFp] = await Promise.all([
        api.get('/Contabilidad/ConsolidadoIngresosEgresos', {
          params: { fechaDesde: d, fechaHasta: h },
        }),
        api.get('/Contabilidad/ConsolidadoFormaPago', {
          params: { fechaDesde: d + 'T00:00:00', fechaHasta: h + 'T23:59:59' },
        }),
      ]);
      setIe(resIe.data ?? null);
      setFp(resFp.data ?? null);
      setRangoConsultado({ desde: d, hasta: h });
    } catch (e) {
      logger.error('Error cargando finanzas:', e);
      // No mostrar cifras de otro período como si fueran las actuales
      setIe(null);
      setFp(null);
      setError('No se pudieron cargar las finanzas. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!esAdmin) return;
      if (periodo === 'personalizado') {
        fetchData(rangoRef.current.desde, rangoRef.current.hasta);
      } else {
        const r = getRango(periodo);
        setDesde(r.desde);
        setHasta(r.hasta);
        rangoRef.current = r;
        fetchData(r.desde, r.hasta);
      }
    }, [esAdmin, periodo, fetchData])
  );

  const cambiarPeriodo = (p: Periodo) => setPeriodo(p);

  const onPickFecha = (dateStr?: string) => {
    if (!dateStr || !pickerVisible) return;
    if (pickerVisible === 'desde') {
      setDesde(dateStr);
      rangoRef.current.desde = dateStr;
    } else {
      setHasta(dateStr);
      rangoRef.current.hasta = dateStr;
    }
    setPickerVisible(null);
  };

  const buscarRango = () => fetchData(desde, hasta);

  if (!esAdmin) {
    return (
      <View style={styles.centered}>
        <FontAwesome5 name="lock" size={40} color={COLORS.textTertiary} />
        <Text style={styles.deniedText}>Solo los administradores pueden ver las finanzas.</Text>
      </View>
    );
  }

  // Movimiento de caja (por fecha del servicio): lo cobrado a clientes por cada medio de pago
  const cobradoEfectivo = fp?.totalEfectivo ?? 0;
  const cobradoTransfer = fp?.totalTransferencia ?? 0;
  const totalCobrado = cobradoEfectivo + cobradoTransfer;
  const pctEfectivo = totalCobrado > 0 ? Math.round((cobradoEfectivo / totalCobrado) * 100) : 0;
  const pctTransfer = totalCobrado > 0 ? 100 - pctEfectivo : 0;

  // Campos nuevos del consolidado por forma de pago (un back antiguo no los envía)
  const hayFlujoPorMetodo = [
    fp?.egresosPagadosEfectivo,
    fp?.egresosPagadosTransferencia,
    fp?.pagosLiquidacionesEfectivo,
    fp?.pagosLiquidacionesTransferencia,
    fp?.netoEfectivo,
    fp?.netoTransferencia,
  ].some(definido);
  const haySaldoTotal = definido(fp?.netoEfectivo) || definido(fp?.netoTransferencia);
  const saldoTotalCaja = (fp?.netoEfectivo ?? 0) + (fp?.netoTransferencia ?? 0);
  const haySalidas = [
    fp?.egresosPagadosEfectivo,
    fp?.egresosPagadosTransferencia,
    fp?.pagosLiquidacionesEfectivo,
    fp?.pagosLiquidacionesTransferencia,
  ].some((v) => definido(v) && v !== 0);
  const sinMovimientoCaja = totalCobrado === 0 && !haySalidas;

  // Rentabilidad (por fecha de liquidación): solo la parte de la empresa
  const utilidad = ie?.consolidado ?? 0;
  const rangoTexto = rangoConsultado
    ? rangoConsultado.desde === rangoConsultado.hasta
      ? formatDate(rangoConsultado.desde)
      : `${formatDate(rangoConsultado.desde)} – ${formatDate(rangoConsultado.hasta)}`
    : null;

  const metodos = [
    {
      key: 'E',
      titulo: '💵 Efectivo',
      entro: cobradoEfectivo,
      gastos: fp?.egresosPagadosEfectivo,
      personal: fp?.pagosLiquidacionesEfectivo,
      saldo: fp?.netoEfectivo,
    },
    {
      key: 'T',
      titulo: '💳 Transferencia',
      entro: cobradoTransfer,
      gastos: fp?.egresosPagadosTransferencia,
      personal: fp?.pagosLiquidacionesTransferencia,
      saldo: fp?.netoTransferencia,
    },
  ];

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
              <Text
                style={[styles.periodoText, periodo === p.key && styles.periodoTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Rango de fechas personalizado */}
        {periodo === 'personalizado' && (
          <View style={styles.rangoBox}>
            <View style={styles.dateRow}>
              <Pressable
                style={({ pressed }) => [styles.dateInputBox, pressed && styles.dateInputBoxPressed]}
                onPress={() => setPickerVisible('desde')}
              >
                <Text style={styles.chipLabel}>Desde</Text>
                <Text style={styles.dateValue}>{desde}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.dateInputBox, pressed && styles.dateInputBoxPressed]}
                onPress={() => setPickerVisible('hasta')}
              >
                <Text style={styles.chipLabel}>Hasta</Text>
                <Text style={styles.dateValue}>{hasta}</Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [styles.buscarBtn, pressed && styles.buscarBtnPressed, loading && styles.buscarBtnDisabled]}
              onPress={buscarRango}
              disabled={loading}
            >
              <FontAwesome5 name="search" size={13} color={COLORS.white} />
              <Text style={styles.buscarBtnText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
            </Pressable>
          </View>
        )}

        {rangoTexto && !loading && !error && <Text style={styles.rangoTexto}>Período: {rangoTexto}</Text>}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando métricas...</Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorBox}>
                <FontAwesome5 name="exclamation-triangle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  style={({ pressed }) => [styles.reintentarBtn, pressed && styles.buscarBtnPressed]}
                  onPress={() => fetchData(rangoRef.current.desde, rangoRef.current.hasta)}
                >
                  <Text style={styles.buscarBtnText}>Reintentar</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Rentabilidad del negocio */}
                <Seccion
                  icon="chart-line"
                  titulo="Rentabilidad del negocio"
                  ayuda="Lo que gana la empresa: solo su parte de cada servicio, registrada al liquidar al personal (por fecha de liquidación)."
                />
                <View style={styles.kpiRow}>
                  <View style={[styles.kpiCard, { borderLeftColor: COLORS.success }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: COLORS.successLight }]}>
                      <FontAwesome5 name="arrow-up" size={14} color={COLORS.success} />
                    </View>
                    <Text style={styles.kpiLabel}>Ingresos de la empresa</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.success }]} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(ie?.totalIngresos ?? 0)}
                    </Text>
                    <Text style={styles.kpiHint}>Parte de la empresa en las liquidaciones</Text>
                  </View>

                  <View style={[styles.kpiCard, { borderLeftColor: COLORS.error }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: COLORS.errorLight }]}>
                      <FontAwesome5 name="arrow-down" size={14} color={COLORS.error} />
                    </View>
                    <Text style={styles.kpiLabel}>Gastos del negocio</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.error }]} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(ie?.totalEgresos ?? 0)}
                    </Text>
                    <Text style={styles.kpiHint}>Sin adelantos descontados al personal</Text>
                  </View>
                </View>

                <View style={[styles.utilidadCard, utilidad < 0 && { backgroundColor: COLORS.error }]}>
                  <View style={styles.utilidadHeader}>
                    <FontAwesome5 name="wallet" size={16} color={COLORS.white} />
                    <Text style={styles.utilidadLabel}>Utilidad neta</Text>
                  </View>
                  <Text style={styles.utilidadValue} numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(utilidad)}
                  </Text>
                  <Text style={styles.utilidadHint}>Ingresos de la empresa − Gastos del negocio</Text>
                </View>

                {definido(ie?.deduccionesRecuperadas) && (
                  <View style={styles.infoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fpLabel}>Deducciones recuperadas</Text>
                      <Text style={styles.kpiHint}>
                        Adelantos y gastos descontados al personal al liquidar. Informativo: no suma a la utilidad.
                      </Text>
                    </View>
                    <Text style={styles.fpAmount}>{formatCurrency(ie?.deduccionesRecuperadas ?? 0)}</Text>
                  </View>
                )}

                {/* Movimiento de caja */}
                <Seccion
                  icon="cash-register"
                  titulo="Movimiento de caja"
                  ayuda="Dinero que entró y salió por cada medio de pago (por fecha del servicio o del gasto). Incluye la parte del personal, por eso no es igual a la utilidad."
                />

                {sinMovimientoCaja ? (
                  <View style={styles.card}>
                    <Text style={styles.emptyText}>Sin movimientos de caja en este período</Text>
                  </View>
                ) : (
                  <>
                    {/* Cobrado a clientes y distribución por medio de pago */}
                    <View style={styles.card}>
                      <View style={styles.fpHeaderRow}>
                        <Text style={styles.fpLabel}>Cobrado a clientes por servicios</Text>
                        <Text style={styles.cobradoValor}>{formatCurrency(totalCobrado)}</Text>
                      </View>
                      {totalCobrado > 0 && (
                        <>
                          <View style={[styles.barTrack, styles.barStack]}>
                            <View style={{ width: `${pctEfectivo}%`, backgroundColor: COLORS.success }} />
                            <View style={{ width: `${pctTransfer}%`, backgroundColor: COLORS.info }} />
                          </View>
                          <View style={styles.leyendaRow}>
                            <Text style={styles.leyenda}>
                              <Text style={{ color: COLORS.success }}>●</Text> Efectivo {formatCurrency(cobradoEfectivo)} · {pctEfectivo}%
                            </Text>
                            <Text style={styles.leyenda}>
                              <Text style={{ color: COLORS.info }}>●</Text> Transferencia {formatCurrency(cobradoTransfer)} · {pctTransfer}%
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {hayFlujoPorMetodo && (
                      <>
                        <View style={styles.metodosGrid}>
                          {metodos.map((m) => (
                            <View key={m.key} style={[styles.card, styles.metodoCard]}>
                              <Text style={styles.flujoTitulo}>{m.titulo}</Text>
                              <FilaFlujo label="Entró por servicios" valor={m.entro} />
                              <FilaFlujo label="Salió en gastos y adelantos" valor={m.gastos} signo="-" />
                              <FilaFlujo label="Salió en pagos al personal" valor={m.personal} signo="-" />
                              <FilaFlujo label="Saldo" valor={m.saldo} destacado />
                            </View>
                          ))}
                        </View>

                        {haySaldoTotal && (
                          <View style={styles.saldoTotalCard}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.saldoTotalLabel}>Saldo total de caja</Text>
                              <Text style={styles.kpiHint}>Saldo en efectivo + saldo en transferencia</Text>
                            </View>
                            <Text
                              style={[styles.saldoTotalValor, saldoTotalCaja < 0 && { color: COLORS.error }]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                            >
                              {formatCurrency(saldoTotalCaja)}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

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

      <SimpleDatePicker
        value={pickerVisible === 'desde' ? desde : hasta}
        onChange={onPickFecha}
        visible={pickerVisible !== null}
        onClose={() => setPickerVisible(null)}
        title={pickerVisible === 'desde' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha final'}
      />
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
  rangoBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  dateRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
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
  chipLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  dateValue: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: FONT_WEIGHT.semibold },
  buscarBtn: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  buscarBtnPressed: { backgroundColor: COLORS.primaryDark, transform: [{ scale: 0.98 }] },
  buscarBtnDisabled: { backgroundColor: COLORS.border, ...SHADOWS.none },
  buscarBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
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
  kpiHint: { fontSize: 10, color: COLORS.textTertiary, marginTop: SPACING.xs },
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
  rangoTexto: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: SPACING.md, textAlign: 'center' },
  errorBox: {
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  errorText: { fontSize: FONT_SIZE.sm, color: COLORS.errorDark, textAlign: 'center' },
  reintentarBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  seccionHeader: { marginBottom: SPACING.md, marginTop: SPACING.xs },
  seccionTituloRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  seccionTitulo: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  seccionAyuda: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: SPACING.xxs },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cobradoValor: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  barStack: { flexDirection: 'row', marginTop: SPACING.xs },
  leyendaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.xs, marginTop: SPACING.xs },
  leyenda: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  metodosGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING.md },
  metodoCard: { flexGrow: 1, flexBasis: '45%', minWidth: 240 },
  saldoTotalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  saldoTotalLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  saldoTotalValor: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.successDark },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.md },
  flujoTitulo: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.xs },
  flujoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm, paddingVertical: SPACING.xxs },
  flujoRowDestacado: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.xs, paddingTop: SPACING.sm },
  flujoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flexShrink: 1 },
  flujoLabelDestacado: { color: COLORS.text, fontWeight: FONT_WEIGHT.bold },
  flujoValor: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: FONT_WEIGHT.semibold },
  fpHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  fpLabel: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: FONT_WEIGHT.medium },
  fpAmount: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold },
  barTrack: {
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
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
