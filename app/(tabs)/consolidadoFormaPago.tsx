import SimpleDatePicker from '@/components/SimpleDatePicker';
import { AppText, Button, Card, ChipGroup, DateField, Icon, LoadingState, type IconName } from '@/components/ds';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { formatCurrency, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { api } from '../api/api';
import { ConsolidadoFormaPago } from '../api/modelos/contabilidad';

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, backgroundColor: t.colores.fondo, padding: SPACING.lg },
  scroll: { paddingBottom: SPACING.huge },
  etiquetaFiltro: { marginBottom: SPACING.sm },
  fila: { flexDirection: 'row' as const, gap: SPACING.md, marginBottom: SPACING.lg },
  tituloTarjeta: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: SPACING.sm },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  filaResultado: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colores.divisor,
  },
  filaUltima: { borderBottomWidth: 0 },
  etiquetaFila: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  tarjeta: { marginBottom: SPACING.lg },
});

type TonoFila = 'normal' | 'exito' | 'error' | 'info';

// Fila opcional: si el back es antiguo y no envía el campo, la fila se omite
function FilaResultado({
  label,
  valor,
  tono = 'normal',
  texto,
  destacado,
  ultima,
}: {
  label: string;
  valor?: number | null;
  tono?: TonoFila;
  texto?: string;
  destacado?: boolean;
  ultima?: boolean;
}) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  if (valor === undefined || valor === null) return null;
  const c = tema.colores;
  const color = destacado
    ? valor >= 0
      ? c.exitoTexto
      : c.errorTexto
    : tono === 'error'
      ? c.errorTexto
      : tono === 'exito'
        ? c.exitoTexto
        : tono === 'info'
          ? c.infoTexto
          : c.texto;
  return (
    <View style={[estilos.filaResultado, ultima && estilos.filaUltima]}>
      <AppText variante={destacado ? 'etiqueta' : 'cuerpo'} tono={destacado ? 'normal' : 'suave'} style={estilos.etiquetaFila}>
        {label}
      </AppText>
      <AppText variante={destacado ? 'subtitulo' : 'etiqueta'} style={{ color }}>
        {texto ?? formatCurrency(valor)}
      </AppText>
    </View>
  );
}

function TarjetaFormaPago({
  titulo,
  icono,
  tono,
  children,
}: {
  titulo: string;
  icono: IconName;
  tono: 'info' | 'success';
  children: React.ReactNode;
}) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const c = tema.colores;
  const paleta = tono === 'info' ? { fondo: c.infoSuave, texto: c.infoTexto } : { fondo: c.exitoSuave, texto: c.exitoTexto };
  return (
    <Card style={estilos.tarjeta}>
      <View style={estilos.tituloTarjeta}>
        <View style={[estilos.icono, { backgroundColor: paleta.fondo }]}>
          <Icon name={icono} size={18} color={paleta.texto} />
        </View>
        <AppText variante="subtitulo">{titulo}</AppText>
      </View>
      {children}
    </Card>
  );
}

export default function ConsolidadoFormaPagoScreen() {
  const estilos = useEstilos(crearEstilos);
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
      logger.log('API ConsolidadoFormaPago:', res.data);
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
    <View style={estilos.contenedor}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scroll}>
        <Card>
          <AppText variante="etiqueta" style={estilos.etiquetaFiltro}>
            Rango de fechas
          </AppText>
          <View style={estilos.fila}>
            <DateField label="Desde" value={fechaInicio} onPress={() => setPickerVisible('inicio')} />
            <DateField label="Hasta" value={fechaFin} onPress={() => setPickerVisible('fin')} />
          </View>

          <ChipGroup
            label="Forma de pago"
            value={formaPago}
            onChange={(k) => setFormaPago(k as 'todos' | 'T' | 'E')}
            options={[
              { key: 'todos', label: 'Todas', icon: 'list-outline' },
              { key: 'E', label: 'Efectivo', icon: 'cash-outline' },
              { key: 'T', label: 'Transferencia', icon: 'swap-horizontal-outline' },
            ]}
          />

          <Button title={loading ? 'Buscando...' : 'Buscar'} icon="search" onPress={fetchData} disabled={loading} />
        </Card>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <TarjetaFormaPago titulo="Transferencia" icono="swap-horizontal-outline" tono="info">
              <FilaResultado label="Servicios cobrados" valor={data?.cantidadTransferencia ?? 0} texto={String(data?.cantidadTransferencia ?? 0)} />
              <FilaResultado label="Entró por servicios" valor={data?.totalTransferencia ?? 0} tono="info" />
              <FilaResultado label="Salió en gastos y adelantos" valor={data?.egresosPagadosTransferencia} tono="error" texto={data?.egresosPagadosTransferencia != null ? `- ${formatCurrency(data.egresosPagadosTransferencia)}` : undefined} />
              <FilaResultado label="Salió en pagos al personal" valor={data?.pagosLiquidacionesTransferencia} tono="error" texto={data?.pagosLiquidacionesTransferencia != null ? `- ${formatCurrency(data.pagosLiquidacionesTransferencia)}` : undefined} />
              <FilaResultado label="Saldo de caja (transferencia)" valor={data?.netoTransferencia} destacado ultima />
            </TarjetaFormaPago>

            <TarjetaFormaPago titulo="Efectivo" icono="cash-outline" tono="success">
              <FilaResultado label="Servicios cobrados" valor={data?.cantidadEfectivo ?? 0} texto={String(data?.cantidadEfectivo ?? 0)} />
              <FilaResultado label="Entró por servicios" valor={data?.totalEfectivo ?? 0} tono="exito" />
              <FilaResultado label="Salió en gastos y adelantos" valor={data?.egresosPagadosEfectivo} tono="error" texto={data?.egresosPagadosEfectivo != null ? `- ${formatCurrency(data.egresosPagadosEfectivo)}` : undefined} />
              <FilaResultado label="Salió en pagos al personal" valor={data?.pagosLiquidacionesEfectivo} tono="error" texto={data?.pagosLiquidacionesEfectivo != null ? `- ${formatCurrency(data.pagosLiquidacionesEfectivo)}` : undefined} />
              <FilaResultado label="Saldo de caja (efectivo)" valor={data?.netoEfectivo} destacado ultima />
            </TarjetaFormaPago>
          </>
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
