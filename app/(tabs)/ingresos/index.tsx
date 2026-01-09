import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { api } from '../../api/api';

export type HistorialIngreso = {
  fecha: string;
  totalRegistros: number;
  totalIngresado: number;
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

export default function IngresosEmpresa() {
  const [historial, setHistorial] = useState<HistorialIngreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputValue(start);
  });
  const [fechaHasta, setFechaHasta] = useState(() => toDateInputValue(new Date()));

  const isWeb = Platform.OS === 'web';

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
      console.error('❌ Error al cargar historial de ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const formatFecha = (valor: string) => {
    const date = new Date(valor);
    return date.toLocaleDateString('es-CO');
  };

  const formatMonto = (valor: number) => {
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
  const currentPickerDate = pickerVisible === 'desde' ? new Date(fechaDesde) : new Date(fechaHasta);

  const onChangeFecha = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate || !pickerVisible) return;
    const value = toDateInputValue(selectedDate);
    if (pickerVisible === 'desde') setFechaDesde(value);
    if (pickerVisible === 'hasta') setFechaHasta(value);
    if (Platform.OS !== 'ios') setPickerVisible(null);
  };

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

        <TouchableOpacity style={styles.buscarButton} onPress={cargarHistorial} disabled={loading}>
          <Text style={styles.buscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </TouchableOpacity>
      </View>

      {!isWeb && pickerVisible && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setPickerVisible(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={currentPickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={onChangeFecha}
              />
              <TouchableOpacity style={styles.closeModal} onPress={() => setPickerVisible(null)}>
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.resumen}>
        <Text style={styles.resumenLabel}>Total ingresado en rango</Text>
        <Text style={styles.resumenMonto}>{formatMonto(totalIngresado)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00b894" />
      ) : historial.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2d3436', textAlign: 'center' }}>No hay ingresos en este rango</Text>
          <Text style={{ fontSize: 14, color: '#636e72', textAlign: 'center', marginTop: 8 }}>Intenta con otras fechas</Text>
        </View>
      ) : (
        <ScrollView>
          {historial.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.fecha}>📅 {formatFecha(item.fecha)}</Text>
              <Text style={styles.registros}>Registros: {item.totalRegistros}</Text>
              <Text style={styles.total}>💵 {formatMonto(item.totalIngresado)}</Text>
            </View>
          ))}
        </ScrollView>
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
  buscarButton: {
    backgroundColor: '#00b894',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buscarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 24, color: '#636e72' },
  card: {
    backgroundColor: '#dfe6e9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  fecha: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  registros: { fontSize: 14, color: '#2d3436', marginBottom: 4 },
  total: { fontSize: 15, color: '#00b894', fontWeight: 'bold', marginTop: 6 },
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
