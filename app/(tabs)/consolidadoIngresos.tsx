import SimpleDatePicker from '@/components/SimpleDatePicker';
import { AppText, Button, Card, DateField, Icon, StatCard } from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { formatCurrency, toDateInputValue } from '../../utils/formatters';
import { api } from '../api/api';

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  scroll: { paddingBottom: SPACING.huge },
  etiquetaFiltro: { marginBottom: SPACING.sm },
  fila: { flexDirection: 'row' as const, gap: SPACING.md, marginBottom: SPACING.md },
  kpis: { flexDirection: 'row' as const, gap: SPACING.md, marginBottom: SPACING.md },
  kpi: { flex: 1 },
  filaDeducciones: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  deduccionesTexto: { flex: 1, minWidth: 0, flexDirection: 'row' as const, alignItems: 'center' as const, marginRight: SPACING.sm },
  textoIcono: { marginLeft: SPACING.sm, flexShrink: 1 },
});

export default function ConsolidadoIngresos() {
  const { usuario } = useAuth();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
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
    deduccionesRecuperadas?: number;
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
        deduccionesRecuperadas: res.data.deduccionesRecuperadas,
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

  const moneda = (valor?: number) =>
    (valor ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const neto = consolidado?.consolidado ?? 0;

  return (
    <View style={estilos.contenedor}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scroll}>
        <Card>
          <AppText variante="etiqueta" style={estilos.etiquetaFiltro}>
            Rango de fechas
          </AppText>
          <View style={estilos.fila}>
            <DateField label="Desde" value={fechaDesde} onPress={() => setPickerVisible('desde')} />
            <DateField label="Hasta" value={fechaHasta} onPress={() => setPickerVisible('hasta')} />
          </View>
          <Button title={loading ? 'Buscando...' : 'Buscar'} icon="search" onPress={fetchConsolidado} disabled={loading} />
        </Card>

        {consolidado && (
          <>
            <View style={estilos.kpis}>
              <StatCard
                style={estilos.kpi}
                label="Ingresos"
                value={moneda(consolidado.totalIngresos)}
                icon="trending-up-outline"
                tone="success"
              />
              <StatCard
                style={estilos.kpi}
                label="Egresos"
                value={moneda(consolidado.totalEgresos)}
                icon="trending-down-outline"
                tone="error"
              />
            </View>

            {neto >= 0 ? (
              <StatCard
                variant="solid"
                icon="stats-chart-outline"
                label="Consolidado"
                value={moneda(neto)}
                hint="Ingresos menos egresos"
              />
            ) : (
              <StatCard
                icon="stats-chart-outline"
                tone="error"
                label="Consolidado"
                value={moneda(neto)}
                hint="Ingresos menos egresos"
              />
            )}

            {/* Informativo: egresos descontados a los barberos en liquidaciones (no altera el consolidado) */}
            {consolidado.deduccionesRecuperadas !== undefined && consolidado.deduccionesRecuperadas !== null && (
              <Card style={{ marginTop: SPACING.md }}>
                <View style={estilos.filaDeducciones}>
                  <View style={estilos.deduccionesTexto}>
                    <Icon name="swap-horizontal-outline" size={18} color={tema.colores.infoTexto} />
                    <AppText variante="etiqueta" tono="suave" style={estilos.textoIcono}>
                      Deducciones recuperadas
                    </AppText>
                  </View>
                  <AppText variante="etiqueta" style={{ color: tema.colores.infoTexto }}>
                    {formatCurrency(consolidado.deduccionesRecuperadas)}
                  </AppText>
                </View>
              </Card>
            )}
          </>
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
