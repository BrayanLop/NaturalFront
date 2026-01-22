import LoadingView from '@/components/LoadingView';
import SimpleDatePicker from '@/components/SimpleDatePicker';
import { toDateInputValue } from '@/utils/formatters';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/authContext';
import { api } from '../api/api';

interface ConsolidadoFormaPago {
  cantidadTransferencia: number;
  totalTransferencia: number;
  cantidadEfectivo: number;
  totalEfectivo: number;
}

export default function ConsolidadoFormaPagoScreen() {
  const { usuario } = useAuth();
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
      console.log('API ConsolidadoFormaPago:', res.data);
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
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.filtros}>
          <Text style={styles.titulo}>Consolidado por forma de Pago</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setPickerVisible('inicio')}>
              <Text style={styles.chipLabel}>Desde</Text>
              <Text style={styles.chipValue}>{fechaInicio}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setPickerVisible('fin')}>
              <Text style={styles.chipLabel}>Hasta</Text>
              <Text style={styles.chipValue}>{fechaFin}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipsRow}>
            {[{ key: 'todos', label: 'Todas' }, { key: 'E', label: 'Efectivo' }, { key: 'T', label: 'Transferencia' }].map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, formaPago === opt.key && styles.chipActive]}
                onPress={() => setFormaPago(opt.key as any)}
              >
                <Text style={[styles.chipText, formaPago === opt.key && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.btnBuscar} onPress={fetchData} disabled={loading}>
            <Text style={styles.btnBuscarText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <LoadingView />
        ) : (
          <View style={styles.resultadoBox}>
            <Text style={styles.resultadoTitulo}>Transferencia</Text>
            <Text style={styles.resultadoDato}>Cantidad: {data?.cantidadTransferencia ?? 0}</Text>
            <Text style={styles.resultadoDato}>Total: ${data?.totalTransferencia?.toLocaleString('es-CO', { minimumFractionDigits: 2 }) ?? '0.00'}</Text>
            <View style={{ height: 16 }} />
            <Text style={styles.resultadoTitulo}>Efectivo</Text>
            <Text style={styles.resultadoDato}>Cantidad: {data?.cantidadEfectivo ?? 0}</Text>
            <Text style={styles.resultadoDato}>Total: ${data?.totalEfectivo?.toLocaleString('es-CO', { minimumFractionDigits: 2 }) ?? '0.00'}</Text>
          </View>
        )}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 40 },
  filtros: { backgroundColor: '#fff', borderRadius: 10, padding: 12, margin: 16, elevation: 2 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#2d3436', marginBottom: 12, textAlign: 'center' },
  dateChip: { flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#f1f2f6', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#dfe6e9', marginRight: 4 },
  chipLabel: { fontSize: 12, color: '#636e72', marginBottom: 2, fontWeight: '600' },
  chipValue: { fontSize: 15, color: '#2d3436', fontWeight: 'bold' },
  chipsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#dfe6e9', marginRight: 6 },
  chipActive: { backgroundColor: '#00b894' },
  chipText: { color: '#636e72', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  btnBuscar: { backgroundColor: '#00b894', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  btnBuscarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultadoBox: { backgroundColor: '#fff', borderRadius: 10, padding: 18, margin: 16, elevation: 2 },
  resultadoTitulo: { fontSize: 16, fontWeight: 'bold', color: '#0984e3', marginBottom: 6 },
  resultadoDato: { fontSize: 15, color: '#2d3436', marginBottom: 2 },
});
