import { AppText, Button, Card, Chip, Icon, Input } from '@/components/ds';
import { RADIUS, SPACING, sombra, useEstilos, useTheme, type Tema } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, View } from 'react-native';
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
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
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
  const todoEfectivo = hayPago && !Number.isNaN(valorEfectivo) && Math.abs(valorEfectivo - neto) <= TOLERANCIA;
  const todoTransferencia = hayPago && !Number.isNaN(valorTransferencia) && Math.abs(valorTransferencia - neto) <= TOLERANCIA;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCerrar}>
      <View style={estilos.backdrop}>
        <View style={estilos.content}>
          <AppText variante="subtitulo" style={estilos.titulo}>
            Resumen de liquidación
          </AppText>

          {cargando ? (
            <View style={estilos.centrado}>
              <ActivityIndicator size="large" color={tema.colores.primario} />
              <AppText tono="suave">Calculando liquidación...</AppText>
            </View>
          ) : error ? (
            <AppText tono="error">{error}</AppText>
          ) : resumen ? (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <AppText variante="subtitulo">{resumen.nombrePersona}</AppText>
              {resumen.fechaDesde && resumen.fechaHasta && (
                <View style={estilos.periodo}>
                  <Icon name="calendar-outline" size={14} color={tema.colores.textoSuave} />
                  <AppText variante="nota" tono="suave" style={estilos.textoConIcono}>
                    {formatDate(resumen.fechaDesde)} – {formatDate(resumen.fechaHasta)}
                  </AppText>
                </View>
              )}

              <Card style={estilos.bloque}>
                <Fila label="Servicios" valor={String(resumen.cantidadServicios)} />
                <Fila label="Total facturado" valor={formatCurrency(resumen.totalFacturado)} />
                <Fila label="Comisión del barbero" valor={formatCurrency(resumen.totalComision)} />
                <Fila label="Deducciones" valor={`- ${formatCurrency(resumen.totalDeducciones)}`} error />
              </Card>

              <Card variant="tinted" style={estilos.bloque}>
                <AppText variante="etiqueta" tono="primario">
                  NETO A PAGAR
                </AppText>
                <AppText
                  variante="titulo"
                  tono={neto < 0 ? 'error' : 'primario'}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(neto)}
                </AppText>
              </Card>

              {sinServicios && (
                <AppText variante="nota" tono="suave" style={estilos.nota}>
                  No hay servicios confirmados pendientes por liquidar.
                </AppText>
              )}

              {hayPago ? (
                <View style={estilos.reparto}>
                  <AppText variante="etiqueta" style={estilos.subtitulo}>
                    Reparto del pago
                  </AppText>
                  <View style={estilos.rapidosRow}>
                    <Chip
                      label="Todo efectivo"
                      icon="cash-outline"
                      selected={todoEfectivo}
                      onPress={() => cambiarEfectivo(aTexto(neto))}
                    />
                    <Chip
                      label="Todo transferencia"
                      icon="swap-horizontal-outline"
                      selected={todoTransferencia}
                      onPress={() => cambiarTransferencia(aTexto(neto))}
                    />
                  </View>

                  <Input
                    label="Efectivo"
                    leftIcon="cash-outline"
                    value={efectivo}
                    onChangeText={cambiarEfectivo}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Input
                    label="Transferencia"
                    leftIcon="swap-horizontal-outline"
                    value={transferencia}
                    onChangeText={cambiarTransferencia}
                    keyboardType="numeric"
                    placeholder="0"
                    error={errorReparto ?? undefined}
                  />
                </View>
              ) : (
                !sinServicios && (
                  <AppText variante="nota" tono="suave" style={estilos.nota}>
                    El neto es {formatCurrency(neto)}: no se registra pago al barbero.
                  </AppText>
                )
              )}
            </ScrollView>
          ) : null}

          <View style={estilos.botones}>
            <View style={estilos.boton}>
              <Button title="Cancelar" variant="secondary" onPress={onCerrar} disabled={liquidando} />
            </View>
            <View style={estilos.boton}>
              <Button
                title={liquidando ? 'Liquidando...' : 'Confirmar'}
                icon="checkmark"
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

function Fila({ label, valor, error }: { label: string; valor: string; error?: boolean }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.fila}>
      <AppText tono="suave" style={estilos.filaLabel}>
        {label}
      </AppText>
      <AppText variante="etiqueta" tono={error ? 'error' : 'normal'}>
        {valor}
      </AppText>
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  backdrop: {
    flex: 1,
    backgroundColor: t.colores.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: SPACING.lg,
  },
  content: {
    backgroundColor: t.colores.superficieElevada,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%' as const,
    maxWidth: 440,
    maxHeight: '90%' as const,
    ...sombra(t, 'lg'),
  },
  titulo: { marginBottom: SPACING.md },
  centrado: { alignItems: 'center' as const, padding: SPACING.xl, gap: SPACING.md },
  periodo: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: SPACING.xs },
  textoConIcono: { marginLeft: SPACING.xs },
  nota: { marginTop: SPACING.sm },
  bloque: { marginTop: SPACING.md, marginBottom: 0 },
  reparto: { marginTop: SPACING.lg },
  subtitulo: { marginBottom: SPACING.sm },
  fila: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.xs,
  },
  filaLabel: { flexShrink: 1, marginRight: SPACING.md },
  rapidosRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  botones: { flexDirection: 'row' as const, gap: SPACING.sm, marginTop: SPACING.lg },
  boton: { flex: 1, minWidth: 0 },
});
