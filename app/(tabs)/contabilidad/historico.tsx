import SimpleDatePicker from '@/components/SimpleDatePicker';
import { useAuth } from '@/context/authContext';
import { formatCurrency, formatDate, toDateInputValue } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { isTrabajador } from '@/utils/roles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
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
        <Text style={styles.persona}>{item.nombrePersona}</Text>
        <Text style={styles.fecha}>📅 {formatDate(item.fechaLiquidacion)}</Text>
        <Text style={styles.total}>💵 {formatCurrency(item.totalPagado)}</Text>
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
            <TouchableOpacity style={styles.dateChip} onPress={() => setPickerVisible('desde')}>
              <Text style={styles.chipLabel}>Desde</Text>
              <Text style={styles.chipValue}>{fechaDesde}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateChip} onPress={() => setPickerVisible('hasta')}>
              <Text style={styles.chipLabel}>Hasta</Text>
              <Text style={styles.chipValue}>{fechaHasta}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!esRol02 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>Persona</Text>
            <TouchableOpacity style={styles.select} onPress={() => setPersonaModal(true)}>
              <Text style={styles.selectText}>
                {personaSeleccionada
                  ? personas.find((p) => p.id === personaSeleccionada)?.nombre || 'Persona seleccionada'
                  : 'Seleccionar persona'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.buscarButton} onPress={cargarHistorial} disabled={loading}>
          <Text style={styles.buscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </TouchableOpacity>
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
        <ActivityIndicator size="large" color="#00b894" />
      ) : historial.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2d3436', textAlign: 'center' }}>No hay historial en este rango</Text>
          <Text style={{ fontSize: 14, color: '#636e72', textAlign: 'center', marginTop: 8 }}>Intenta con otras fechas</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  filtros: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#2d3436' },
  input: {
    borderWidth: 1,
    borderColor: '#b2bec3',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  buscarButton: {
    backgroundColor: '#00b894',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buscarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoRol: { fontSize: 12, color: '#0984e3' },
  emptyText: { textAlign: 'center', marginTop: 24, color: '#636e72' },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#dfe6e9',
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
    maxWidth: '48%',
  },
  persona: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  fecha: { fontSize: 14, color: '#2d3436' },
  total: { fontSize: 15, color: '#00b894', fontWeight: 'bold', marginTop: 6 },
  observacion: { marginTop: 4, color: '#636e72' },
  row: { flexDirection: 'row', gap: 10 },
  dateChip: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#b2bec3',
  },
  chipLabel: { fontSize: 12, color: '#636e72' },
  chipValue: { fontSize: 16, fontWeight: '600', color: '#2d3436' },
  dateInputBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#b2bec3',
    gap: 6,
  },
  webDateInput: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b2bec3',
    fontSize: 14,
  },
  select: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b2bec3',
    padding: 12,
  },
  selectText: { color: '#2d3436', fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: '90%',
    maxWidth: 400,
  },
  closeModal: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#00b894',
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: 'bold' },
  resumen: {
    backgroundColor: '#e8f8f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00b89433',
  },
  resumenLabel: { color: '#2d3436', fontWeight: '600' },
  resumenMonto: { color: '#00b894', fontWeight: 'bold', fontSize: 16 },
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
