import SimpleDatePicker from '@/components/SimpleDatePicker';
import { useAuth } from '@/context/authContext';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { toDateInputValue } from '../../utils/formatters';
import { api } from '../api/api';
import { Persona } from '../api/modelos/persona';

export default function ConsolidadoIngresos() {
  const { usuario } = useAuth();
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
  } | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<number | undefined>(undefined);
  const [personaModal, setPersonaModal] = useState(false);

  useEffect(() => {
    if (usuario?.rol !== '01') {
      Alert.alert('Acceso denegado', 'Solo administradores pueden ver el consolidado.');
    } else {
      // Cargar personas solo para admin
      api.get('/Persona/Obtener')
        .then(res => setPersonas(res.data || []))
        .catch(() => setPersonas([]));
    }
  }, [usuario]);

  const fetchConsolidado = async () => {
    if (usuario?.rol !== '01') return;
    setLoading(true);
    try {
      const params: any = {
        fechaDesde,
        fechaHasta,
      };
      if (personaSeleccionada) params.personaId = personaSeleccionada;
      const res = await api.get('/Contabilidad/ConsolidadoIngresosEgresos', { params });
      setConsolidado({
        totalIngresos: res.data.totalIngresos,
        totalEgresos: res.data.totalEgresos,
        consolidado: res.data.consolidado,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresos y egresos</Text>
      <View style={styles.filtros}>
        <Text style={styles.label}>Rango de fechas</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity style={[styles.dateInputBox, { flex: 1 }]} onPress={() => setPickerVisible('desde')}>
            <Text style={styles.chipLabel}>Desde</Text>
            <Text style={styles.dateValue}>{fechaDesde}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateInputBox, { flex: 1 }]} onPress={() => setPickerVisible('hasta')}>
            <Text style={styles.chipLabel}>Hasta</Text>
            <Text style={styles.dateValue}>{fechaHasta}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Persona</Text>
        <TouchableOpacity style={styles.select} onPress={() => setPersonaModal(true)}>
          <Text style={styles.selectText}>
            {personaSeleccionada
              ? (personas.find((p) => p.id === personaSeleccionada)?.nombre || 'Persona seleccionada')
              : 'Seleccionar persona'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={fetchConsolidado} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
        </TouchableOpacity>
      </View>
      {/* Modal de selección de persona */}
      <Modal transparent animationType="fade" visible={personaModal} onRequestClose={() => setPersonaModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}> 
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Seleccionar persona</Text>
            <FlatList
              data={personas}
              keyExtractor={(p) => p.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ paddingVertical: 10 }}
                  onPress={() => { setPersonaSeleccionada(item.id); setPersonaModal(false); }}
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
              <TouchableOpacity style={[styles.closeModal, { backgroundColor: '#b2bec3' }]} onPress={() => { setPersonaSeleccionada(undefined); setPersonaModal(false); }}>
                <Text style={styles.closeText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeModal} onPress={() => setPersonaModal(false)}>
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {consolidado && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>Total Ingresos: <Text style={styles.ingresos}>{consolidado.totalIngresos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</Text></Text>
          <Text style={styles.resultText}>Total Egresos: <Text style={styles.egresos}>{consolidado.totalEgresos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</Text></Text>
          <Text style={styles.resultText}>Consolidado: <Text style={consolidado.consolidado >= 0 ? styles.ingresos : styles.egresos}>{consolidado.consolidado.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</Text></Text>
        </View>
      )}
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

const styles = StyleSheet.create({
    select: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#ced4da',
      alignItems: 'center',
    },
    selectText: {
      fontSize: 15,
      color: '#636e72',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      width: '90%',
      maxWidth: 400,
      elevation: 5,
    },
    closeModal: {
      flex: 1,
      backgroundColor: '#636e72',
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    closeText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15,
    },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#14534c',
    textAlign: 'center',
  },
  filtros: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#2d3436' },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInputBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  chipLabel: { fontSize: 12, color: '#636e72', marginBottom: 4 },
  dateValue: { fontSize: 14, color: '#2d3436', marginBottom: 4 },
  webDateInput: {
    width: '100%',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#14534c',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  resultText: {
    fontSize: 18,
    marginBottom: 10,
  },
  ingresos: {
    color: '#00b894',
    fontWeight: 'bold',
  },
  egresos: {
    color: '#d63031',
    fontWeight: 'bold',
  },
});
