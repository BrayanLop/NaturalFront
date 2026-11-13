import SimpleDatePicker from '@/components/SimpleDatePicker';
import { AppText, Button, Card, DateField, EmptyState, ListRow, LoadingState, StatCard } from '@/components/ds';
import { SPACING, useEstilos, type Tema } from '@/theme';
import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { api } from '../../api/api';

export type HistorialIngreso = {
  fecha: string;
  totalRegistros: number;
  totalIngresado: number;
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  fila: { flexDirection: 'row' as const, gap: SPACING.md, marginBottom: SPACING.md },
  lista: { paddingBottom: SPACING.huge },
  montoFila: { alignItems: 'flex-end' as const, marginLeft: SPACING.sm },
  tarjetaTotal: { marginBottom: SPACING.lg },
  etiquetaFiltro: { marginBottom: SPACING.sm },
});

export default function IngresosEmpresa() {
  const estilos = useEstilos(crearEstilos);
  const [historial, setHistorial] = useState<HistorialIngreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputValue(start);
  });
  const [fechaHasta, setFechaHasta] = useState(() => toDateInputValue(new Date()));

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await api.get('Contabilidad/HistorialIngresosEmpresa', {
        params: {
          fechaDesde,
          fechaHasta,
        },
      });
      setHistorial(response.data || []);
    } catch (error) {
      logger.error('Error al cargar historial de ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const formatFecha = (valor: string) => {
    if (!valor) return 'Sin fecha';
    const date = new Date(valor);
    return date.toLocaleDateString('es-CO');
  };

  const formatMonto = (valor: number) => {
    if (valor === null || valor === undefined) return '$0';
    return valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalIngresado = historial.reduce((acc, item) => acc + (item.totalIngresado || 0), 0);

  // Date picker handling
  const [pickerVisible, setPickerVisible] = useState<null | 'desde' | 'hasta'>(null);

  return (
    <View style={estilos.contenedor}>
      <Card>
        <AppText variante="etiqueta" style={estilos.etiquetaFiltro}>
          Rango de fechas
        </AppText>
        <View style={estilos.fila}>
          <DateField label="Desde" value={fechaDesde} onPress={() => setPickerVisible('desde')} />
          <DateField label="Hasta" value={fechaHasta} onPress={() => setPickerVisible('hasta')} />
        </View>
        <Button title={loading ? 'Buscando...' : 'Buscar'} icon="search" onPress={cargarHistorial} disabled={loading} />
      </Card>

      {/* SimpleDatePicker JS universal */}
      <SimpleDatePicker
        value={fechaDesde}
        onChange={(dateStr) => { setFechaDesde(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'desde'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha desde"
      />
      <SimpleDatePicker
        value={fechaHasta}
        onChange={(dateStr) => { setFechaHasta(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'hasta'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha hasta"
      />

      <StatCard
        style={estilos.tarjetaTotal}
        variant="solid"
        icon="trending-up-outline"
        label="Total ingresado en el rango"
        value={formatMonto(totalIngresado)}
        hint={`${historial.length} día${historial.length !== 1 ? 's' : ''} con registros`}
      />

      {loading ? (
        <LoadingState message="Cargando ingresos..." />
      ) : historial.length === 0 ? (
        <EmptyState icon="trending-up-outline" title="No hay ingresos en este rango" subtitle="Intenta con otras fechas" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.lista}>
          {historial.map((item, index) => (
            <ListRow
              key={index}
              icon="calendar-outline"
              title={formatFecha(item.fecha)}
              subtitle={`${item.totalRegistros} registro${item.totalRegistros === 1 ? '' : 's'}`}
              trailing={
                <AppText variante="etiqueta" tono="primario" style={estilos.montoFila}>
                  {formatMonto(item.totalIngresado)}
                </AppText>
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
