import {
  Button,
  Card,
  ChipGroup,
  DateField,
  EmptyState,
  Icon,
  LoadingState,
  SectionHeader,
  StatCard,
  type IconName,
} from '@/components/ds';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import {
  COLORES_DETALLE,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SPACING,
  sombra,
  useEstilos,
  useTheme,
  type Tema,
} from '@/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { api } from '../../api/api';
import { ConsolidadoFormaPago, ConsolidadoIngresosEgresos } from '../../api/modelos/contabilidad';

type Periodo = 'hoy' | 'semana' | 'mes' | 'personalizado';

type ConsolidadoIE = ConsolidadoIngresosEgresos;
type FormaPago = ConsolidadoFormaPago;

// Fila del movimiento de caja; se omite si el back (antiguo) no envía el campo
function FilaFlujo({ label, valor, signo, destacado }: { label: string; valor?: number | null; signo?: '-'; destacado?: boolean }) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  if (valor === undefined || valor === null) return null;
  const c = tema.colores;
  const colorValor = destacado ? (valor >= 0 ? c.exitoTexto : c.errorTexto) : signo === '-' && valor !== 0 ? c.errorTexto : c.texto;
  return (
    <View style={[estilos.flujoRow, destacado && { borderTopWidth: 1, borderTopColor: c.divisor, marginTop: SPACING.xs, paddingTop: SPACING.md }]}>
      <Text style={[estilos.flujoLabel, destacado && estilos.flujoLabelDestacado]}>{label}</Text>
      <Text style={[estilos.flujoValor, { color: colorValor }, destacado && { fontWeight: FONT_WEIGHT.bold }]}>
        {signo === '-' && valor !== 0 ? '− ' : ''}
        {formatCurrency(valor)}
      </Text>
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

const ACCESOS: { title: string; desc: string; icon: IconName; color: string; route: string }[] = [
  { title: 'Consolidado', desc: 'Ingresos vs egresos', icon: 'stats-chart', color: COLORES_DETALLE.consolidado, route: '/(tabs)/consolidadoIngresos' },
  { title: 'Formas de pago', desc: 'Efectivo y transferencia', icon: 'card', color: COLORES_DETALLE.formasPago, route: '/(tabs)/consolidadoFormaPago' },
  { title: 'Ingresos', desc: 'Control de ingresos', icon: 'trending-up', color: COLORES_DETALLE.ingresos, route: '/(tabs)/ingresos' },
  { title: 'Egresos', desc: 'Control de gastos', icon: 'trending-down', color: COLORES_DETALLE.egresos, route: '/(tabs)/egresos' },
  { title: 'Histórico', desc: 'Historial de pagos', icon: 'archive', color: COLORES_DETALLE.historico, route: '/(tabs)/contabilidad/historico' },
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
  const { tema } = useTheme();
  const c = tema.colores;
  const estilos = useEstilos(crearEstilos);
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
      <View style={estilos.centered}>
        <EmptyState
          icon="lock-closed-outline"
          title="Solo administradores"
          subtitle="Solo los administradores pueden ver las finanzas."
        />
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

  const metodos: {
    key: string;
    titulo: string;
    icono: IconName;
    entro: number;
    gastos?: number | null;
    personal?: number | null;
    saldo?: number | null;
  }[] = [
    {
      key: 'E',
      titulo: 'Efectivo',
      icono: 'cash-outline',
      entro: cobradoEfectivo,
      gastos: fp?.egresosPagadosEfectivo,
      personal: fp?.pagosLiquidacionesEfectivo,
      saldo: fp?.netoEfectivo,
    },
    {
      key: 'T',
      titulo: 'Transferencia',
      icono: 'swap-horizontal-outline',
      entro: cobradoTransfer,
      gastos: fp?.egresosPagadosTransferencia,
      personal: fp?.pagosLiquidacionesTransferencia,
      saldo: fp?.netoTransferencia,
    },
  ];

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Selector de período */}
        <ChipGroup
          options={PERIODOS}
          value={periodo}
          onChange={(k) => cambiarPeriodo(k as Periodo)}
        />

        {/* Rango de fechas personalizado */}
        {periodo === 'personalizado' && (
          <Card>
            <View style={estilos.dateRow}>
              <DateField label="Desde" value={desde} onPress={() => setPickerVisible('desde')} />
              <DateField label="Hasta" value={hasta} onPress={() => setPickerVisible('hasta')} />
            </View>
            <View style={{ height: SPACING.md }} />
            <Button
              title={loading ? 'Buscando...' : 'Buscar'}
              icon="search"
              onPress={buscarRango}
              disabled={loading}
            />
          </Card>
        )}

        {rangoTexto && !loading && !error && (
          <View style={estilos.rangoTexto}>
            <Icon name="calendar-outline" size={14} color={c.textoSuave} />
            <Text style={estilos.rangoTextoLabel}>{rangoTexto}</Text>
          </View>
        )}

        {loading ? (
          <LoadingState message="Cargando métricas..." />
        ) : (
          <>
            {error ? (
              <Card>
                <View style={estilos.errorFila}>
                  <Icon name="alert-circle-outline" size={22} color={c.errorTexto} />
                  <Text style={estilos.errorText}>{error}</Text>
                </View>
                <View style={{ height: SPACING.md }} />
                <Button
                  title="Reintentar"
                  variant="secondary"
                  onPress={() => fetchData(rangoRef.current.desde, rangoRef.current.hasta)}
                />
              </Card>
            ) : (
              <>
                {/* Rentabilidad del negocio */}
                <SectionHeader
                  icon="trending-up-outline"
                  title="Rentabilidad"
                  ayuda="Lo que gana la empresa: solo su parte de cada servicio, registrada al liquidar al personal (por fecha de liquidación)."
                />
                <View style={estilos.kpiRow}>
                  <StatCard
                    style={estilos.kpi}
                    label="Ingresos"
                    value={formatCurrency(ie?.totalIngresos ?? 0)}
                    hint="Parte de la empresa"
                    icon="arrow-up"
                    tone="success"
                  />
                  <StatCard
                    style={estilos.kpi}
                    label="Gastos"
                    value={formatCurrency(ie?.totalEgresos ?? 0)}
                    hint="Sin adelantos al personal"
                    icon="arrow-down"
                    tone="error"
                  />
                </View>

                {utilidad < 0 ? (
                  <StatCard
                    tone="error"
                    icon="wallet-outline"
                    label="Utilidad neta"
                    value={formatCurrency(utilidad)}
                    hint="Ingresos − gastos"
                  />
                ) : (
                  <StatCard
                    variant="solid"
                    icon="wallet-outline"
                    label="Utilidad neta"
                    value={formatCurrency(utilidad)}
                    hint="Ingresos − gastos"
                  />
                )}

                {definido(ie?.deduccionesRecuperadas) && (
                  <Card style={{ marginTop: SPACING.md }}>
                    <View style={estilos.filaEntre}>
                      <View style={estilos.textosFlex}>
                        <Text style={estilos.etiquetaFuerte}>Deducciones recuperadas</Text>
                        <Text style={estilos.pista}>Informativo: no suma a la utilidad</Text>
                      </View>
                      <Text style={estilos.valorMedio}>{formatCurrency(ie?.deduccionesRecuperadas ?? 0)}</Text>
                    </View>
                  </Card>
                )}

                {/* Movimiento de caja */}
                <SectionHeader
                  icon="cash-outline"
                  title="Movimiento de caja"
                  ayuda="Dinero que entró y salió por cada medio de pago (por fecha del servicio o del gasto). Incluye la parte del personal, por eso no es igual a la utilidad."
                  style={{ marginTop: SPACING.xl }}
                />

                {sinMovimientoCaja ? (
                  <Card>
                    <Text style={estilos.vacio}>Sin movimientos de caja en este período</Text>
                  </Card>
                ) : (
                  <>
                    {/* Cobrado a clientes y distribución por medio de pago */}
                    <Card>
                      <View style={estilos.filaEntre}>
                        <Text style={estilos.etiquetaFuerte}>Cobrado a clientes</Text>
                        <Text style={estilos.valorMedio}>{formatCurrency(totalCobrado)}</Text>
                      </View>
                      {totalCobrado > 0 && (
                        <>
                          <View
                            style={estilos.barra}
                            accessible
                            accessibilityLabel={`Efectivo ${pctEfectivo} por ciento, transferencia ${pctTransfer} por ciento`}
                          >
                            {pctEfectivo > 0 && <View style={{ flex: pctEfectivo, backgroundColor: c.serie1 }} />}
                            {pctEfectivo > 0 && pctTransfer > 0 && <View style={estilos.hueco} />}
                            {pctTransfer > 0 && <View style={{ flex: pctTransfer, backgroundColor: c.serie2 }} />}
                          </View>
                          <View style={estilos.leyenda}>
                            <View style={estilos.leyendaFila}>
                              <View style={[estilos.marca, { backgroundColor: c.serie1 }]} />
                              <Text style={estilos.leyendaNombre}>Efectivo</Text>
                              <Text style={estilos.leyendaValor}>
                                {formatCurrency(cobradoEfectivo)} · {pctEfectivo}%
                              </Text>
                            </View>
                            <View style={estilos.leyendaFila}>
                              <View style={[estilos.marca, { backgroundColor: c.serie2 }]} />
                              <Text style={estilos.leyendaNombre}>Transferencia</Text>
                              <Text style={estilos.leyendaValor}>
                                {formatCurrency(cobradoTransfer)} · {pctTransfer}%
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </Card>

                    {hayFlujoPorMetodo && (
                      <>
                        {metodos.map((m) => (
                          <Card key={m.key}>
                            <View style={estilos.metodoTitulo}>
                              <Icon name={m.icono} size={18} color={c.primarioTexto} />
                              <Text style={estilos.flujoTitulo}>{m.titulo}</Text>
                            </View>
                            <FilaFlujo label="Cobrado" valor={m.entro} />
                            <FilaFlujo label="Gastos y adelantos" valor={m.gastos} signo="-" />
                            <FilaFlujo label="Pagos al personal" valor={m.personal} signo="-" />
                            <FilaFlujo label="Saldo" valor={m.saldo} destacado />
                          </Card>
                        ))}

                        {haySaldoTotal && (
                          <Card variant="tinted">
                            <View style={estilos.filaEntre}>
                              <View style={estilos.textosFlex}>
                                <Text style={estilos.etiquetaFuerte}>Saldo total de caja</Text>
                                <Text style={estilos.pista}>Efectivo + transferencia</Text>
                              </View>
                              <Text
                                style={[estilos.saldoTotal, { color: saldoTotalCaja < 0 ? c.errorTexto : c.primarioTexto }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                              >
                                {formatCurrency(saldoTotalCaja)}
                              </Text>
                            </View>
                          </Card>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Accesos a detalle */}
            <SectionHeader icon="list-outline" title="Ver detalle" style={{ marginTop: SPACING.xl }} />
            {ACCESOS.map((a) => (
              <Pressable
                key={a.title}
                accessibilityRole="button"
                accessibilityLabel={`${a.title}. ${a.desc}`}
                style={({ pressed }) => [estilos.acceso, pressed && { opacity: 0.9 }]}
                onPress={() => router.push(a.route as any)}
              >
                <View style={[estilos.accesoIcono, { backgroundColor: a.color }]}>
                  <Icon name={a.icon} size={20} color={c.blanco} />
                </View>
                <View style={estilos.textosFlex}>
                  <Text style={estilos.accesoTitulo}>{a.title}</Text>
                  <Text style={estilos.pista} numberOfLines={1}>
                    {a.desc}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={c.textoTenue} />
              </Pressable>
            ))}
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

const crearEstilos = (t: Tema) => ({
  container: { flex: 1, backgroundColor: t.colores.fondo },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  centered: { flex: 1, backgroundColor: t.colores.fondo, justifyContent: 'center' as const },
  dateRow: { flexDirection: 'row' as const, gap: SPACING.md },
  rangoTexto: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  rangoTextoLabel: { fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave },
  errorFila: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: SPACING.md },
  errorText: { flex: 1, minWidth: 0, fontSize: FONT_SIZE.callout, color: t.colores.errorTexto },
  kpiRow: { flexDirection: 'row' as const, gap: SPACING.md, marginBottom: SPACING.md },
  kpi: { flex: 1 },
  filaEntre: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  textosFlex: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  etiquetaFuerte: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  pista: { fontSize: FONT_SIZE.footnote, color: t.colores.textoSuave, marginTop: 2 },
  valorMedio: { fontSize: FONT_SIZE.title3, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto },
  vacio: { fontSize: FONT_SIZE.callout, color: t.colores.textoSuave, textAlign: 'center' as const, paddingVertical: SPACING.md },
  // Barra proporcional efectivo / transferencia (2 px de separación, extremos redondeados)
  barra: {
    flexDirection: 'row' as const,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden' as const,
    backgroundColor: t.colores.bordeSuave,
    marginTop: SPACING.lg,
  },
  hueco: { width: 2, backgroundColor: t.colores.superficie },
  leyenda: { marginTop: SPACING.md, gap: SPACING.sm },
  leyendaFila: { flexDirection: 'row' as const, alignItems: 'center' as const },
  marca: { width: 10, height: 10, borderRadius: 3, marginRight: SPACING.sm },
  leyendaNombre: { flex: 1, fontSize: FONT_SIZE.subhead, color: t.colores.textoSuave },
  leyendaValor: { fontSize: FONT_SIZE.subhead, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
  metodoTitulo: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: SPACING.sm, marginBottom: SPACING.sm },
  flujoTitulo: { fontSize: FONT_SIZE.headline, fontWeight: FONT_WEIGHT.bold, color: t.colores.texto },
  flujoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.xs + 1,
  },
  flujoLabel: { flex: 1, fontSize: FONT_SIZE.callout, color: t.colores.textoSuave, marginRight: SPACING.md },
  flujoLabelDestacado: { color: t.colores.texto, fontWeight: FONT_WEIGHT.semibold },
  flujoValor: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.medium },
  saldoTotal: { fontSize: FONT_SIZE.title1, fontWeight: FONT_WEIGHT.bold, maxWidth: '55%' as const },
  acceso: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: t.colores.superficie,
    borderWidth: 1,
    borderColor: t.colores.borde,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...sombra(t, 'sm'),
  },
  accesoIcono: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  accesoTitulo: { fontSize: FONT_SIZE.callout, fontWeight: FONT_WEIGHT.semibold, color: t.colores.texto },
});
