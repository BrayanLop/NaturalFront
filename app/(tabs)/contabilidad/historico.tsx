import SimpleDatePicker from '@/components/SimpleDatePicker';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isTrabajador } from '@/utils/roles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from '../../api/api';
import { HistorialLiquidacion } from '../../api/modelos/contabilidad';
import { Persona } from '../../api/modelos/persona';

export default function HistoricoLiquidaciones() {
  const { usuario } = useAuth();
  const [historial, setHistorial] = useState<HistorialLiquidacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<number | undefined>(undefined);
  const [personaModal, setPersonaModal] = useState(false);
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

  const isWeb = Platform.OS === 'web';

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

  const renderItem = useCallback(
    ({ item }: { item: HistorialLiquidacion }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardAvatarContainer}>
            <FontAwesome5 name="user" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.persona} numberOfLines={1}>{item.nombrePersona}</Text>
        </View>
        <View style={styles.cardRow}>
          <FontAwesome5 name="calendar" size={12} color={COLORS.textSecondary} />
          <Text style={styles.fecha}>{formatDate(item.fechaLiquidacion)}</Text>
        </View>
        <View style={styles.cardTotal}>
          <Text style={styles.total}>{formatCurrency(item.totalPagado)}</Text>
        </View>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback(
    (_: HistorialLiquidacion, index: number) => index.toString(),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSubtitle}>Liquidaciones realizadas</Text>
        </View>
      </View>

      <View style={styles.filtros}>
        <Text style={styles.label}>Rango de fechas</Text>
        {isWeb ? (
          <View style={styles.row}>
            <View style={styles.dateInputBox}>
              <Text style={styles.chipLabel}>Desde</Text>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={styles.webDateInput as any}
              />
            </View>
            <View style={styles.dateInputBox}>
              <Text style={styles.chipLabel}>Hasta</Text>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={styles.webDateInput as any}
              />
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <Pressable 
              style={({ pressed }) => [styles.dateChip, pressed && styles.dateChipPressed]} 
              onPress={() => setPickerVisible('desde')}
            >
              <Text style={styles.chipLabel}>Desde</Text>
              <Text style={styles.chipValue}>{fechaDesde}</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [styles.dateChip, pressed && styles.dateChipPressed]}
              onPress={() => setPickerVisible('hasta')}
            >
              <Text style={styles.chipLabel}>Hasta</Text>
              <Text style={styles.chipValue}>{fechaHasta}</Text>
            </Pressable>
          </View>
        )}

        {!esRol02 && (
          <View style={styles.personaSection}>
            <Text style={styles.label}>Persona</Text>
            <Pressable 
              style={({ pressed }) => [styles.select, pressed && styles.selectPressed]} 
              onPress={() => setPersonaModal(true)}
            >
              <Text style={styles.selectText}>
                {personaSeleccionada
                  ? personas.find((p) => p.id === personaSeleccionada)?.nombre || 'Persona seleccionada'
                  : 'Seleccionar persona'}
              </Text>
              <FontAwesome5 name="chevron-down" size={12} color={COLORS.textSecondary} />
            </Pressable>
          </View>
        )}

        <Pressable 
          style={({ pressed }) => [
            styles.buscarButton, 
            pressed && styles.buscarButtonPressed,
            loading && styles.buscarButtonDisabled
          ]} 
          onPress={cargarHistorial} 
          disabled={loading}
        >
          <FontAwesome5 name="search" size={14} color={COLORS.white} />
          <Text style={styles.buscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </Pressable>
      </View>

      <View style={styles.resumen}>
        <Text style={styles.resumenLabel}>Total pagado en rango</Text>
        <Text style={styles.resumenMonto}>{formatCurrency(totalPagado)}</Text>
      </View>

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

      {!esRol02 && (
        <PersonaModal
          visible={personaModal}
          personas={personas}
          onClose={() => setPersonaModal(false)}
          onSelect={(id) => {
            setPersonaSeleccionada(id);
            setPersonaModal(false);
          }}
          onClear={() => {
            setPersonaSeleccionada(undefined);
            setPersonaModal(false);
          }}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : historial.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome5 name="calendar-alt" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No hay historial en este rango</Text>
          <Text style={styles.emptySubtitle}>Intenta con otras fechas</Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={keyExtractor}
          numColumns={2}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.lg, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  filtros: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  label: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  personaSection: {
    marginTop: SPACING.md,
  },
  buscarButton: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.primary,
  },
  buscarButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  buscarButtonDisabled: {
    backgroundColor: COLORS.border,
    ...SHADOWS.none,
  },
  buscarText: { 
    color: COLORS.white, 
    fontWeight: FONT_WEIGHT.semibold, 
    fontSize: FONT_SIZE.md 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    flex: 1,
    marginHorizontal: SPACING.xs,
    maxWidth: '48%',
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cardAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  persona: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.text,
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  fecha: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary 
  },
  cardTotal: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  total: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.success, 
    fontWeight: FONT_WEIGHT.bold,
  },
  row: { 
    flexDirection: 'row', 
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateChipPressed: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  chipLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  chipValue: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.text 
  },
  dateInputBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  webDateInput: {
    width: '100%',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  selectPressed: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  selectText: { 
    color: COLORS.text, 
    fontSize: FONT_SIZE.sm 
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  closeModal: {
    flex: 1,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  closeText: { 
    color: COLORS.white, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  resumen: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  resumenLabel: { 
    color: COLORS.text, 
    fontWeight: FONT_WEIGHT.medium,
    fontSize: FONT_SIZE.sm,
  },
  resumenMonto: { 
    color: COLORS.success, 
    fontWeight: FONT_WEIGHT.bold, 
    fontSize: FONT_SIZE.lg,
  },
});

type PersonaModalProps = {
  visible: boolean;
  personas: { id: number; nombre: string; apellido?: string }[];
  onSelect: (id: number) => void;
  onClose: () => void;
  onClear: () => void;
};

function PersonaModal({ visible, personas, onSelect, onClose, onClear }: PersonaModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalContent, { maxHeight: '70%' }]}> 
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Seleccionar persona</Text>
          <FlatList
            data={personas}
            keyExtractor={(p) => p.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ paddingVertical: 10 }}
                onPress={() => onSelect(item.id)}
              >
                <Text>{item.nombre} {item.apellido ?? ''}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#ececec' }} />}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>👤</Text>
                <Text style={{ fontSize: 14, color: '#636e72' }}>No hay personas</Text>
              </View>
            }
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity style={[styles.closeModal, { backgroundColor: '#b2bec3' }]} onPress={onClear}>
              <Text style={styles.closeText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeModal} onPress={onClose}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
