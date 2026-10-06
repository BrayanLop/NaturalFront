import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING, commonStyles } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PagoLiquidacion, ResumenLiquidacion } from '../app/api/modelos/contabilidad';

const TOLERANCIA = 0.01;

type Props = {
  visible: boolean;
  cargando: boolean;
  resumen: ResumenLiquidacion | null;
  error: string | null;
  liquidando: boolean;
  onCerrar: () => void;
  /** Recibe los pagos a enviar (vacío si el neto es <= 0). */
  onConfirmar: (pagos: PagoLiquidacion[]) => void;
};

const redondear = (valor: number) => Math.round(valor * 100) / 100;

/** Convierte el texto del input en número (admite "60000", "60.000" o "60000,50"). */
function parseMonto(texto: string): number {
  const limpio = texto.trim();
  if (!limpio) return 0;
  // Con coma: los puntos son separadores de miles y la coma es decimal.
  const normalizado = limpio.includes(',')
    ? limpio.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(limpio)
      ? limpio.replace(/\./g, '')
      : limpio;
  const n = Number(normalizado.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

const aTexto = (valor: number) => (valor === 0 ? '0' : String(redondear(valor)));

export default function ResumenLiquidacionModal({
  visible,
  cargando,
  resumen,
  error,
  liquidando,
  onCerrar,
  onConfirmar,
}: Props) {
  const neto = redondear(resumen?.netoAPagar ?? 0);
  const hayPago = neto > 0;

  const [efectivo, setEfectivo] = useState('');
  const [transferencia, setTransferencia] = useState('');

  // Por defecto, todo en efectivo cada vez que llega un resumen nuevo
  useEffect(() => {
    if (resumen && neto > 0) {
      setEfectivo(aTexto(neto));
      setTransferencia('0');
    } else {
      setEfectivo('');
      setTransferencia('');
    }
  }, [resumen, neto]);

  const valorEfectivo = parseMonto(efectivo);
  const valorTransferencia = parseMonto(transferencia);

  const cambiarEfectivo = (texto: string) => {
    setEfectivo(texto);
    const v = parseMonto(texto);
    if (!Number.isNaN(v)) setTransferencia(aTexto(Math.max(0, redondear(neto - v))));
  };

  const cambiarTransferencia = (texto: string) => {
    setTransferencia(texto);
    const v = parseMonto(texto);
    if (!Number.isNaN(v)) setEfectivo(aTexto(Math.max(0, redondear(neto - v))));
  };

  let errorReparto: string | null = null;
  if (hayPago) {
    if (Number.isNaN(valorEfectivo) || Number.isNaN(valorTransferencia)) {
      errorReparto = 'Ingresa montos válidos.';
    } else if (valorEfectivo < 0 || valorTransferencia < 0) {
      errorReparto = 'Los montos no pueden ser negativos.';
    } else if (Math.abs(valorEfectivo + valorTransferencia - neto) > TOLERANCIA) {
      errorReparto = `La suma (${formatCurrency(valorEfectivo + valorTransferencia)}) debe ser igual al neto a pagar (${formatCurrency(neto)}).`;
    }
  }

  const confirmar = () => {
    if (!resumen || errorReparto) return;
    if (!hayPago) {
      onConfirmar([]);
      return;
    }
    const pagos: PagoLiquidacion[] = [];
    if (valorEfectivo > 0) pagos.push({ formaPago: 'E', valor: redondear(valorEfectivo) });
    if (valorTransferencia > 0) pagos.push({ formaPago: 'T', valor: redondear(valorTransferencia) });
    onConfirmar(pagos);
  };

  const sinServicios = !!resumen && resumen.cantidadServicios === 0;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCerrar}>
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <Text style={styles.titulo}>Resumen de liquidación</Text>

          {cargando ? (
            <View style={styles.centrado}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.textoSecundario}>Calculando liquidación...</Text>
            </View>
          ) : error ? (
            <Text style={styles.textoError}>{error}</Text>
          ) : resumen ? (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.persona}>{resumen.nombrePersona}</Text>
              {resumen.fechaDesde && resumen.fechaHasta && (
                <Text style={styles.textoSecundario}>
                  Periodo: {formatDate(resumen.fechaDesde)} – {formatDate(resumen.fechaHasta)}
                </Text>
              )}

              <View style={styles.bloque}>
                <Fila label="Servicios" valor={String(resumen.cantidadServicios)} />
                <Fila label="Total facturado" valor={formatCurrency(resumen.totalFacturado)} />
                <Fila label="Comisión del barbero" valor={formatCurrency(resumen.totalComision)} />
                <Fila
                  label="Deducciones"
                  valor={`- ${formatCurrency(resumen.totalDeducciones)}`}
                  colorValor={COLORS.error}
                />
                <View style={styles.divider} />
                <View style={styles.filaNeto}>
                  <Text style={styles.labelNeto}>NETO A PAGAR</Text>
                  <Text style={[styles.valorNeto, neto < 0 && { color: COLORS.error }]}>
                    {formatCurrency(neto)}
                  </Text>
                </View>
              </View>

              {sinServicios && (
                <Text style={styles.nota}>No hay servicios confirmados pendientes por liquidar.</Text>
              )}

              {hayPago ? (
                <View style={styles.bloque}>
                  <Text style={styles.subtitulo}>Reparto del pago</Text>
                  <View style={styles.rapidosRow}>
                    <Pressable
                      style={({ pressed }) => [styles.rapido, pressed && styles.rapidoPressed]}
                      onPress={() => cambiarEfectivo(aTexto(neto))}
                    >
                      <Text style={styles.rapidoTexto}>💵 Todo efectivo</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.rapido, pressed && styles.rapidoPressed]}
                      onPress={() => cambiarTransferencia(aTexto(neto))}
                    >
                      <Text style={styles.rapidoTexto}>💳 Todo transferencia</Text>
                    </Pressable>
                  </View>

                  <Text style={commonStyles.label}>Efectivo</Text>
                  <TextInput
                    value={efectivo}
                    onChangeText={cambiarEfectivo}
                    keyboardType="numeric"
                    placeholder="0"
                    style={[commonStyles.input, styles.input]}
                  />
                  <Text style={commonStyles.label}>Transferencia</Text>
                  <TextInput
                    value={transferencia}
                    onChangeText={cambiarTransferencia}
                    keyboardType="numeric"
                    placeholder="0"
                    style={[commonStyles.input, styles.input]}
                  />
                  {errorReparto && <Text style={styles.textoError}>{errorReparto}</Text>}
                </View>
              ) : (
                !sinServicios && (
                  <Text style={styles.nota}>
                    El neto es {formatCurrency(neto)}: no se registra pago al barbero.
                  </Text>
                )
              )}
            </ScrollView>
          ) : null}

          <View style={styles.botones}>
            <View style={styles.boton}>
              <PrimaryButton title="Cancelar" variant="outline" onPress={onCerrar} disabled={liquidando} />
            </View>
            <View style={styles.boton}>
              <PrimaryButton
                title={liquidando ? 'Liquidando...' : 'Confirmar'}
                variant="danger"
                onPress={confirmar}
                loading={liquidando}
                disabled={cargando || !!error || !resumen || !!errorReparto || liquidando}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  titulo: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  centrado: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  persona: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  textoSecundario: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  textoError: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  nota: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  bloque: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subtitulo: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  filaLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  filaValor: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderMedium,
    marginVertical: SPACING.sm,
  },
  filaNeto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelNeto: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.text,
  },
  valorNeto: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.success,
  },
  rapidosRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rapido: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
  },
  rapidoPressed: {
    backgroundColor: COLORS.primaryBorder,
  },
  rapidoTexto: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  input: {
    marginBottom: SPACING.md,
  },
  botones: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  boton: {
    flex: 1,
  },
});
