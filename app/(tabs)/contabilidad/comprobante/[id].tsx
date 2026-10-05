import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { useRole } from '@/hooks/useRole';
import { generarHtmlComprobante } from '@/utils/comprobanteHtml';
import { formatCurrency, formatDate, formatFormaPago } from '@/utils/formatters';
import { logger, showError } from '@/utils/logger';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../../api/api';
import { ComprobanteLiquidacion } from '../../../api/modelos/contabilidad';

const fecha = (valor?: string | null) => (valor ? formatDate(valor) : '—');

export default function ComprobanteScreen() {
  const { id } = useLocalSearchParams();
  const idLiquidacion = Array.isArray(id) ? id[0] : id;
  const { usuario } = useAuth();
  const { isTrabajador } = useRole();

  const [comprobante, setComprobante] = useState<ComprobanteLiquidacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      if (!idLiquidacion) {
        setError('Comprobante no encontrado');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<ComprobanteLiquidacion>(`Contabilidad/Comprobante/${idLiquidacion}`);
        if (res.status >= 400 || !res.data || typeof res.data !== 'object') {
          throw { response: res };
        }
        setComprobante(res.data);
      } catch (e: any) {
        logger.error('Error cargando comprobante:', e);
        const data = e?.response?.data;
        setError(typeof data === 'string' && data ? data : data?.message || 'No se pudo cargar el comprobante.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [idLiquidacion]);

  const compartirPdf = async () => {
    if (!comprobante) return;
    setCompartiendo(true);
    try {
      const html = generarHtmlComprobante(comprobante);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `Comprobante de liquidación #${comprobante.idLiquidacion}`,
        });
      } else {
        showError('Compartir no está disponible en este dispositivo.');
      }
    } catch (e) {
      logger.error('Error generando PDF del comprobante:', e);
      showError('No se pudo generar el PDF del comprobante.');
    } finally {
      setCompartiendo(false);
    }
  };

  if (loading) return <LoadingView message="Cargando comprobante..." />;

  if (error || !comprobante) {
    return (
      <View style={styles.container}>
        <EmptyState message={error || 'Comprobante no encontrado'} icon="🧾" />
      </View>
    );
  }

  // El trabajador solo puede ver sus propios comprobantes
  if (isTrabajador && usuario && comprobante.persona?.id !== usuario.id) {
    return (
      <View style={styles.container}>
        <EmptyState message="No tienes permisos para ver este comprobante" icon="🔒" />
      </View>
    );
  }

  const c = comprobante;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Encabezado */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <FontAwesome5 name="file-invoice-dollar" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empresa}>{c.empresa?.nombre}</Text>
            <Text style={styles.textoSecundario}>NIT: {c.empresa?.nit || '—'}</Text>
          </View>
          <Text style={styles.numero}>N.º {c.idLiquidacion}</Text>
        </View>
        <View style={styles.divider} />
        <Fila label="Barbero" valor={c.persona?.nombreCompleto ?? '—'} />
        <Fila label="Cédula" valor={c.persona?.cedula || '—'} />
        <Fila label="Fecha de liquidación" valor={fecha(c.fechaLiquidacion)} />
        <Fila label="Periodo" valor={`${fecha(c.periodoDesde)} – ${fecha(c.periodoHasta)}`} />
      </View>

      {/* Detalle por servicio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalle por servicio</Text>
        {c.servicios.length === 0 ? (
          <Text style={styles.vacio}>Sin servicios</Text>
        ) : (
          c.servicios.map((s, i) => (
            <View key={`${s.nombre}-${i}`} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>{s.nombre}</Text>
                <Text style={styles.textoSecundario}>
                  {s.cantidad} × · Facturado {formatCurrency(s.valorFacturado)}
                </Text>
              </View>
              <Text style={styles.itemValor}>{formatCurrency(s.comision)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Deducciones */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Deducciones</Text>
        {c.deducciones.length === 0 ? (
          <Text style={styles.vacio}>Sin deducciones</Text>
        ) : (
          c.deducciones.map((d, i) => (
            <View key={`${d.motivo}-${i}`} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>{d.motivo}</Text>
                <Text style={styles.textoSecundario}>
                  {fecha(d.fecha)} · {formatFormaPago(d.formaPago)}
                </Text>
              </View>
              <Text style={[styles.itemValor, { color: COLORS.error }]}>- {formatCurrency(d.valor)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Totales destacados */}
      <View style={styles.totalesCard}>
        <Fila label="Total cortes" valor={String(c.cantidadServicios)} />
        <Fila label="Total generado (facturado)" valor={formatCurrency(c.totalFacturado)} />
        <Fila label="Comisión del barbero" valor={formatCurrency(c.totalComision)} />
        <Fila label="Total deducciones" valor={`- ${formatCurrency(c.totalDeducciones)}`} colorValor={COLORS.error} />
        <View style={styles.dividerTotales} />
        <View style={styles.netoRow}>
          <Text style={styles.netoLabel}>NETO PAGADO</Text>
          <Text style={styles.netoValor}>{formatCurrency(c.netoPagado)}</Text>
        </View>
        <View style={styles.dividerTotales} />
        <Text style={styles.pagosTitulo}>Pagos por método</Text>
        {c.pagos.length === 0 ? (
          <Text style={styles.vacio}>Sin método de pago registrado</Text>
        ) : (
          c.pagos.map((p, i) => (
            <Fila
              key={`${p.formaPago}-${i}`}
              label={p.formaPago === 'E' ? '💵 Efectivo' : p.formaPago === 'T' ? '💳 Transferencia' : formatFormaPago(p.formaPago)}
              valor={formatCurrency(p.valor)}
            />
          ))
        )}
        {c.esReconstruido && (
          <Text style={styles.nota}>Liquidación anterior: valores reconstruidos, sin método de pago registrado</Text>
        )}
      </View>

      <PrimaryButton
        title={compartiendo ? 'Generando PDF...' : 'Compartir PDF'}
        onPress={compartirPdf}
        loading={compartiendo}
        icon={<FontAwesome5 name="share-alt" size={14} color={COLORS.white} />}
      />
    </ScrollView>
  );
}

function Fila({ label, valor, colorValor }: { label: string; valor: string; colorValor?: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaLabel}>{label}</Text>
      <Text style={[styles.filaValor, colorValor ? { color: colorValor } : null]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empresa: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  numero: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  textoSecundario: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  vacio: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemTitulo: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  itemValor: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  filaLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  filaValor: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    textAlign: 'right',
  },
  totalesCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  dividerTotales: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
    marginVertical: SPACING.sm,
  },
  netoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netoLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.text,
  },
  netoValor: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.successDark,
  },
  pagosTitulo: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  nota: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
});
