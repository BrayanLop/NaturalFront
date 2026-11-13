import SimpleDatePicker from '@/components/SimpleDatePicker';
import {
  AppText,
  Button,
  Card,
  DateField,
  EmptyState,
  IconButton,
  ListRow,
  LoadingState,
  StatCard,
} from '@/components/ds';
import { useAuth } from '@/context/authContext';
import { SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { formatCurrency, formatDate, formatFormaPago, toDateInputValue } from '@/utils/formatters';
import { logger, showError } from '@/utils/logger';
import { isAdmin } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { api } from '../../api/api';
import { EgresoEmpresa } from '../../api/modelos/egreso';

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  cabecera: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.lg,
  },
  cabeceraTexto: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  fila: { flexDirection: 'row' as const, gap: SPACING.md, marginBottom: SPACING.md },
  etiquetaFiltro: { marginBottom: SPACING.sm },
  tarjetaTotal: { marginBottom: SPACING.lg },
  lista: { paddingBottom: SPACING.lg },
  listaVacia: { flex: 1, justifyContent: 'center' as const },
  derecha: { alignItems: 'flex-end' as const, marginLeft: SPACING.sm },
  agregar: { marginTop: SPACING.md },
  sinPermiso: { padding: SPACING.lg, backgroundColor: t.colores.fondo, flex: 1 },
});

export default function ListaEgresos() {
  const router = useRouter();
  const { usuario } = useAuth();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const [egresos, setEgresos] = useState<EgresoEmpresa[]>([]);
  const [loading, setLoading] = useState(false);

  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputValue(start);
  });
  const [fechaFin, setFechaFin] = useState(() => toDateInputValue(new Date()));
  const [pickerVisible, setPickerVisible] = useState<null | 'inicio' | 'fin'>(null);

  const esAdmin = isAdmin(usuario?.rol);

  const cargarEgresos = useCallback(async () => {
    if (!esAdmin) return;

    setLoading(true);
    try {
      const response = await api.get('/EgresosEmpresa/ObtenerEgresosPorRango', {
        params: {
          fechaInicio,
          fechaFin,
        },
      });
      setEgresos(response.data || []);
    } catch (error: any) {
      logger.error('Error al cargar egresos:', error);
      showError('No se pudieron cargar los egresos');
    } finally {
      setLoading(false);
    }
  }, [esAdmin, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarEgresos();
  }, []);

  const totalEgresos = useMemo(
    () => egresos.reduce((acc, item) => acc + (item.valorEgreso || 0), 0),
    [egresos]
  );

  const handleCrear = useCallback(() => {
    router.push('/(tabs)/egresos/crear');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: EgresoEmpresa }) => (
      <ListRow
        icon="trending-down-outline"
        iconColor={tema.colores.errorTexto}
        title={item.nombrePersona || 'Sin persona'}
        subtitle={`${item.motivo || 'Sin motivo'} · ${formatFormaPago(item.formaPago)}`}
        trailing={
          <View style={estilos.derecha}>
            <AppText variante="etiqueta" tono="error">
              {formatCurrency(item.valorEgreso)}
            </AppText>
            <AppText variante="nota" tono="suave">
              {item.fechaRegistro ? formatDate(item.fechaRegistro) : 'Sin fecha'}
            </AppText>
          </View>
        }
      />
    ),
    [estilos, tema]
  );

  const keyExtractor = useCallback((item: EgresoEmpresa, index: number) => `${item.empresaId}-${item.personaId}-${index}`, []);

  const emptyComponent = useMemo(
    () => (
      <EmptyState
        icon="trending-down-outline"
        title="No hay egresos en el rango seleccionado"
        subtitle="Ajusta las fechas o registra un nuevo egreso"
        actionLabel="Registrar egreso"
        onAction={handleCrear}
      />
    ),
    [handleCrear]
  );

  if (!esAdmin) {
    return (
      <View style={estilos.sinPermiso}>
        <EmptyState icon="lock-closed-outline" title="No tienes permisos para ver esta sección" />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <View style={estilos.cabeceraTexto}>
          <AppText variante="subtitulo">Egresos registrados</AppText>
          <AppText variante="nota" tono="suave">
            {egresos.length} registro{egresos.length !== 1 ? 's' : ''} encontrado{egresos.length !== 1 ? 's' : ''}
          </AppText>
        </View>
        <IconButton icon="add" variant="solid" accessibilityLabel="Registrar egreso" onPress={handleCrear} />
      </View>

      <Card>
        <AppText variante="etiqueta" style={estilos.etiquetaFiltro}>
          Rango de fechas
        </AppText>
        <View style={estilos.fila}>
          <DateField label="Desde" value={fechaInicio} onPress={() => setPickerVisible('inicio')} />
          <DateField label="Hasta" value={fechaFin} onPress={() => setPickerVisible('fin')} />
        </View>
        <Button title={loading ? 'Buscando...' : 'Buscar'} icon="search" onPress={cargarEgresos} disabled={loading} />
      </Card>

      {/* Pickers para dispositivos móviles */}
      <SimpleDatePicker
        value={fechaInicio}
        onChange={(dateStr) => { setFechaInicio(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'inicio'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha desde"
      />
      <SimpleDatePicker
        value={fechaFin}
        onChange={(dateStr) => { setFechaFin(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'fin'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha hasta"
      />

      <StatCard
        style={estilos.tarjetaTotal}
        icon="trending-down-outline"
        tone="error"
        label="Total egresos en el rango"
        value={formatCurrency(totalEgresos)}
      />

      {loading ? (
        <LoadingState message="Cargando egresos..." />
      ) : (
        <FlatList
          data={egresos}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={egresos.length === 0 ? estilos.listaVacia : estilos.lista}
        />
      )}

      {egresos.length > 0 && (
        <Button title="Registrar egreso" icon="add" onPress={handleCrear} style={estilos.agregar} />
      )}
    </View>
  );
}
