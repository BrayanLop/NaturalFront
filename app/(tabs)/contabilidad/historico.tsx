import SimpleDatePicker from '@/components/SimpleDatePicker';
import { AppText, Badge, Button, Card, DateField, EmptyState, Icon, LoadingState, Select } from '@/components/ds';
import { RADIUS, SPACING, useEstilos, useTheme, type Tema } from '@/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isTrabajador } from '@/utils/roles';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { api } from '../../api/api';
import { HistorialLiquidacion } from '../../api/modelos/contabilidad';
import { Persona } from '../../api/modelos/persona';

export default function HistoricoLiquidaciones() {
  const { usuario } = useAuth();
  const router = useRouter();
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTheme();
  const [historial, setHistorial] = useState<HistorialLiquidacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<number | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputValue(start);
  });
  const [fechaHasta, setFechaHasta] = useState(() => toDateInputValue(new Date()));
  const personaId = useMemo(() => {
    if (isTrabajador(usuario?.rol) && usuario) return usuario.id;
    return undefined;
  }, [usuario]);

  const esRol02 = isTrabajador(usuario?.rol);

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        fechaDesde,
        fechaHasta,
      };
      if (personaId) params.personaId = personaId;
      else if (personaSeleccionada) params.personaId = personaSeleccionada;

      const response = await api.get('Contabilidad/HistorialLiquidaciones', {
        params,
      });
      setHistorial(response.data || []);
    } catch (error) {
      logger.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, personaId, personaSeleccionada]);

  useEffect(() => {
    cargarHistorial();
  }, [personaId]);

  // Cargar personas sólo para roles que pueden elegir
  useEffect(() => {
    const cargarPersonas = async () => {
      if (esRol02) return;
      try {
        const res = await api.get('Persona/Obtener');
        setPersonas(res.data || []);
      } catch (error) {
        logger.error('Error al cargar personas:', error);
      }
    };
    cargarPersonas();
  }, [esRol02]);

  const totalPagado = useMemo(
    () => historial.reduce((acc, item) => acc + (item.totalPagado || 0), 0),
    [historial]
  );

  // Date picker handling
  const [pickerVisible, setPickerVisible] = useState<null | 'desde' | 'hasta'>(null);
  const currentPickerDate = pickerVisible === 'desde' ? new Date(fechaDesde) : new Date(fechaHasta);

  const onChangeFecha = useCallback((selectedDate?: Date) => {
    if (!selectedDate || !pickerVisible) return;
    const value = toDateInputValue(selectedDate);
    if (pickerVisible === 'desde') setFechaDesde(value);
    if (pickerVisible === 'hasta') setFechaHasta(value);
    setPickerVisible(null);
  }, [pickerVisible]);

  // Abre el comprobante (admin y trabajador; el trabajador solo recibe sus propias liquidaciones)
  const abrirComprobante = useCallback(
    (item: HistorialLiquidacion) => {
      if (!item.idLiquidacion) return;
      router.push(`/contabilidad/comprobante/${item.idLiquidacion}` as any);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: HistorialLiquidacion }) => (
      <Card style={estilos.tarjeta}>
        <View style={estilos.filaPersona}>
          <View style={estilos.avatar}>
            <Icon name="person-outline" size={18} color={tema.colores.primarioTexto} />
          </View>
          <View style={estilos.personaTextos}>
            <AppText variante="etiqueta" numberOfLines={1}>
              {item.nombrePersona}
            </AppText>
            <View style={estilos.filaFecha}>
              <Icon name="calendar-outline" size={14} color={tema.colores.textoSuave} />
              <AppText variante="nota" tono="suave" style={estilos.textoFecha}>
                {formatDate(item.fechaLiquidacion)}
              </AppText>
            </View>
          </View>
          <Badge label="Liquidado" tone="info" size="sm" />
        </View>
        <View style={estilos.totalCaja}>
          <AppText variante="nota" tono="exito">
            Total pagado
          </AppText>
          <AppText variante="numero" tono="exito">
            {formatCurrency(item.totalPagado)}
          </AppText>
        </View>
        {!!item.idLiquidacion && (
          <Button
            title="Ver comprobante"
            variant="secondary"
            size="sm"
            icon="document-text-outline"
            onPress={() => abrirComprobante(item)}
          />
        )}
      </Card>
    ),
    [abrirComprobante, estilos, tema]
  );

  const keyExtractor = useCallback(
    (_: HistorialLiquidacion, index: number) => index.toString(),
    []
  );

  const opcionesPersona = useMemo(
    () => [
      { value: '', label: 'Todas las personas' },
      ...personas.map((p) => ({ value: String(p.id), label: `${p.nombre} ${p.apellido ?? ''}`.trim() })),
    ],
    [personas]
  );

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

        {!esRol02 && (
          <View style={estilos.personaSeccion}>
            <Select
              label="Persona"
              placeholder="Todas las personas"
              value={personaSeleccionada ? String(personaSeleccionada) : ''}
              options={opcionesPersona}
              onChange={(v) => setPersonaSeleccionada(v ? Number(v) : undefined)}
            />
          </View>
        )}

        <Button
          title={loading ? 'Buscando...' : 'Buscar'}
          icon="search"
          onPress={cargarHistorial}
          disabled={loading}
        />
      </Card>

      <Card variant="tinted">
        <View style={estilos.resumen}>
          <View style={estilos.resumenTexto}>
            <AppText variante="etiqueta" tono="primario">
              Total pagado en el rango
            </AppText>
            <AppText variante="nota" tono="suave">
              {historial.length} liquidaci{historial.length !== 1 ? 'ones' : 'ón'}
            </AppText>
          </View>
          <AppText variante="numero" tono="primario" numberOfLines={1} adjustsFontSizeToFit style={estilos.resumenMonto}>
            {formatCurrency(totalPagado)}
          </AppText>
        </View>
      </Card>

      {/* SimpleDatePicker JS universal */}
      <SimpleDatePicker
        value={fechaDesde}
        onChange={(dateStr) => { setFechaDesde(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'desde'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha de inicio"
      />
      <SimpleDatePicker
        value={fechaHasta}
        onChange={(dateStr) => { setFechaHasta(dateStr); setPickerVisible(null); }}
        visible={pickerVisible === 'hasta'}
        onClose={() => setPickerVisible(null)}
        title="Selecciona la fecha final"
      />

      {loading ? (
        <LoadingState message="Cargando historial..." />
      ) : historial.length === 0 ? (
        <EmptyState icon="archive-outline" title="No hay historial en este rango" subtitle="Intenta con otras fechas" />
      ) : (
        <FlatList
          data={historial}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={estilos.lista}
        />
      )}
    </View>
  );
}

const crearEstilos = (t: Tema) => ({
  contenedor: { flex: 1, padding: SPACING.lg, backgroundColor: t.colores.fondo },
  etiquetaFiltro: { marginBottom: SPACING.sm },
  fila: { flexDirection: 'row' as const, gap: SPACING.md, marginBottom: SPACING.md },
  personaSeccion: { marginTop: SPACING.xs },
  resumen: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  resumenTexto: { flex: 1, minWidth: 0, marginRight: SPACING.md },
  resumenMonto: { flexShrink: 1, textAlign: 'right' as const },
  lista: { paddingBottom: SPACING.huge },
  tarjeta: { marginBottom: SPACING.md },
  filaPersona: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: SPACING.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colores.primarioSuave,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: SPACING.md,
  },
  personaTextos: { flex: 1, minWidth: 0, marginRight: SPACING.sm },
  filaFecha: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 2 },
  textoFecha: { marginLeft: SPACING.xs },
  totalCaja: {
    backgroundColor: t.colores.exitoSuave,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center' as const,
  },
});
